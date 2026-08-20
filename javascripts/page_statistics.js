var PageAnalytics = {
    MAX_IDLE_TIME: 5 * 60000,

    visit_id: null,
    last_activity: null,
    active_time: 0, // in seconds
    active_time_timer: null,
    activity_listeners: null,
    count_down: null,

    // initialize

    track_user_visit: function (visit_id, object_xoid) {
        this.reset_visit(visit_id, object_xoid);
        console.log('track user visit');
        window.Excalibur && Excalibur.Mobile.is_mobile_app() && this.mobile_tracking();
        PageAnalytics.get_popup();
        PageAnalytics.run_timeout_timer();
    },

    mobile_tracking: function(){
        var obj = this;
        if( !obj.mobile_tracking_called ) {
            $(document).on('resume', function(e, paused_time){
                obj.resume_load( paused_time, obj );
            });
            $(document).on('pause', function(e, paused_time){
                obj.pause_load( paused_time, obj );
            });
        }
        obj.mobile_tracking_called = true;
    },

    resume_load: function( paused_time, obj ){
        if( paused_time && !isNaN(paused_time) && window.user_inactivity_timer ) {
            paused_time = Date.now() - paused_time;
            if ((window.user_inactivity_timer && paused_time) >= (user_inactivity_timer * 60000 + 30000))
                obj.page_timeout(true);
            else if( window.Excalibur && Excalibur.Mobile.is_mobile_app() )
                obj.start_activity_timer();
        }
    },

    pause_load: function( paused_time, obj ){
        if(window.Excalibur && Excalibur.Mobile.is_mobile_app())
            obj.stop_activity_timer();
        else
            obj.paused_time = Date.now();
    },

    start: function () {
        on_ready(function () {
            PageAnalytics.start_activity_timer();
            PageAnalytics.track_page_lifecycle();
            PageAnalytics.track_ajax_page_swap();
            PageAnalytics.track_scorm_popup_focus();
            session_activity_monitor(function () {
                PageAnalytics.last_activity = Date.now();
            });
        });
    },

    // activite time tracking

    inactivity: function () {
        return Date.now() - this.last_activity;
    },

    update_active_time: function () {
        if (this.inactivity() <= this.MAX_IDLE_TIME) {
            this.active_time++;
            this.activity_listeners && this.activity_listeners(this.visit_id, this.active_time);
        }
    },

    run_timeout_timer: function(){
        var obj = this;
        obj.timeout_timer && clearInterval(obj.timeout_timer);
        obj.timeout_timer = setInterval( function (){
           if( window.user_inactivity_timer && obj.inactivity() >= (user_inactivity_timer * 60000) && !obj.count_down )
                obj.page_timeout();
        }, 1000);
    },

    start_activity_timer: function () {
        if (!this.active_time_timer) {
            this.last_activity = Date.now();
            this.active_time_timer = setInterval(this.update_active_time.bind(PageAnalytics), 1000);
        }
    },

    stop_activity_timer: function () {
        if (this.active_time_timer) {
            clearInterval(this.active_time_timer);
            this.active_time_timer = null;
        }
    },

    is_timer_active: function() {
        return this.active_time_timer !== null;
    },

    add_activity_listener: function(listener) {
        if (this.activity_listeners) {
            var prev_activity_listeners = this.activity_listeners;

            this.activity_listeners = function (visit_id, active_time) {
                prev_activity_listeners(visit_id, active_time);
                listener(visit_id, active_time);
            }
        } else
            this.activity_listeners = listener;
    },

    // page lifecycle tracking

    track_page_lifecycle: function () {
        window.lifecycle && lifecycle.addEventListener('statechange', function (event) {
            var isPause = (event.newState == 'hidden' && event.oldState == 'passive') ||
                          (event.newState == 'passive' && event.oldState == 'active');
            var isResume = (event.newState == 'passive' && event.oldState == 'hidden') ||
                           (event.newState == 'active' && event.oldState == 'passive');

            if (isPause) {
                PageAnalytics.stop_activity_timer();
                PageAnalytics.pause_server_visit();
                if(( window.Excalibur && !Excalibur.Mobile.is_mobile_app() || !window.Excalibur ))
                    PageAnalytics.pause_load(PageAnalytics.paused_time, PageAnalytics);
            }
            else if (isResume) {
                PageAnalytics.start_activity_timer();
                PageAnalytics.resume_server_visit();
                if(( window.Excalibur && !Excalibur.Mobile.is_mobile_app() || !window.Excalibur ))
                    PageAnalytics.resume_load(PageAnalytics.paused_time, PageAnalytics);
            }
            else if (event.newState == 'terminated' || (event.newState == 'frozen' && event.oldState == 'hidden') )
                PageAnalytics.leaving_page();
        });

        $(window).on("beforeunload", function(e, data) {
            PageAnalytics.leaving_page(true);
        });

        window.addEventListener('pageshow', function (event) {
            if (event.persisted && !PageAnalytics.visit_id && PageAnalytics.object_xoid) {
                PageAnalytics.reacquire_visit();
            }
        });
    },

    track_ajax_page_swap: function () {
        $(window).on('preload', function () {
            PageAnalytics.leaving_page();
        });
    },

    track_scorm_popup_focus: function () {
        window.addEventListener("message", function (event) {
            // if the scorm popup is on focus it sends such event every second
            if (event.data === 'scorm_popup_on_focus') {
                this.last_activity = Date.now();
                // if the main windows is minimized or hidden, the timer will be stopped so we need to update the active time
                if(!this.is_timer_active()){
                    this.update_active_time();
                }
            }
        }.bind(this));
    },

    // visit lifecycle

    reset_visit: function (visit_id, object_xoid) {
        this.active_time = 0;
        this.visit_id = visit_id || null;
        this.server_paused = false;
        if (object_xoid !== undefined)
            this.object_xoid = object_xoid;

        if (this.visit_id)
            this.beforeunload_called = false;
    },

    // server pause/resume

    pause_server_visit: function () {
        if (this.visit_id && !this.server_paused) {
            this.server_paused = true;
            Excalibur.Router.send_beacon('/analytics/pause_visit', {
                visit: this.visit_id,
                time_spent: this.active_time
            });
        }
    },

    resume_server_visit: function () {
        if (this.visit_id) {
            this.server_paused = false;
            $.post('/analytics/resume_visit', { visit: this.visit_id });
        }
    },

    reacquire_visit: function () {
        var self = this;
        $.post('/analytics/reacquire_visit', {
            object_xoid: this.object_xoid
        }, function (response) {
            if (response && response.visit_id) {
                self.track_user_visit(response.visit_id, self.object_xoid);
                if (response.inactivity_timer)
                    window.user_inactivity_timer = response.inactivity_timer;
            }
        });
    },

    // leaving page

    leaving_page: function (beforeunload) {
        if ((beforeunload || !this.beforeunload_called) && this.visit_id) {
            this.beforeunload_called = beforeunload;
            var current_visit_id = this.visit_id;
            window.user_inactivity_timer = null;

            Excalibur.Router.send_beacon('/analytics/leaving_page', {
                visit: this.visit_id,
                time_spent: this.active_time
            });

            if (this.visit_id == current_visit_id)
                PageAnalytics.reset_visit();
        }
    },

    page_timeout: function( bypass_popup ){
        PageAnalytics.count_down = true;
        var current_visit_id = this.visit_id;
        var active_time = PageAnalytics.active_time;
        if(!bypass_popup)
            Excalibur.Mobile.popup( 'Are you still there?', PageAnalytics.popup_content, function( popup ){
                setTimeout(function(){
                    var sound = new Audio('/audio/notification-1.mp3');
                    sound.play();
                },10);
                PageAnalytics.popup = popup;
                popup.find('.xCross').remove();
                var count_down = popup.find('.count-down');
                PageAnalytics.count_down = setInterval(function () {
                    var counter = (parseInt(count_down.text()) - 1);
                    count_down.text( counter );
                    if(counter == 0) {
                        clearInterval(PageAnalytics.count_down);
                        location.href = ('/analytics/timeout?time_spent=' + active_time + '&visit=' + current_visit_id) ;
                    }
                }, 1000);
            }, true);
        else {
            Excalibur.Mobile.is_mobile_app() && webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({'method': 'app.setBypassAjax'}));
            location.href = ('/analytics/timeout?time_spent=' + active_time + '&visit=' + current_visit_id);
        }
    },

    get_popup: function(){
        if( !PageAnalytics.popup_content )
            $.get('/analytics/timeout_popup', function ( content ){
                PageAnalytics.popup_content = content;
            });
    },

    resume: function(){
        clearInterval(PageAnalytics.count_down);
        PageAnalytics.count_down = null;
        Excalibur.Mobile.close_popup(PageAnalytics.popup);
    }
}

PageAnalytics.start();

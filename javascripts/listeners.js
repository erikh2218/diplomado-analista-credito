// ===============================
// Services: registry + polling
// ===============================

// ---- Registry (names only) ----
const ServiceScope = Object.freeze({ GLOBAL: 'global', LOCAL: 'local' });

class ServiceRegistry {
    constructor() {
        this.global = new Map(); // name -> { onData, ...meta }
        this.local  = new Map(); // name -> { onData, ...meta }
    }

    /**
     * Register (or merge into) a service.
     * Extra properties (e.g., ids, filters, cursor) are stored and sent in payload().
     * onData is kept out of the payload and is not overwritten unless provided.
     * Return the service that was registered/updated
     */
    register({ name, scope = ServiceScope.GLOBAL, onData = undefined, ...meta }) {
        if (!name) throw new Error('Service name is required');

        const bucket = (scope === ServiceScope.LOCAL ? this.local : this.global);
        const prev = bucket.get(name) || {};
        const next = { ...prev, ...meta };

        if (typeof onData === 'function') next.onData = onData;

        if (!next.onData) next.onData = () => {}; // ensure callable

        bucket.set(name, next);

        // auto-start if we're allowed to poll and nothing was running
        start_polling_if_needed();

        return next; // <-- return the stored service object
    }

    /**
     * Update only the metadata (non-function fields) of a registered service.
     * Does not change scope. No-op if service doesn't exist.
     */
    update(name, patch = {}) {
        const svc = (this.local.get(name) || this.global.get(name));

        if (!svc) return;

        for (const [k, v] of Object.entries(patch)) {
            if (k === 'onData') continue; // never via update()
            svc[k] = v;
        }
    }

    /**
     * Read the full stored service object (including onData). Undefined if missing.
     */
    get(name) {
        return this.local.get(name) || this.global.get(name);
    }

    unregister(name) {
        this.global.delete(name);
        this.local.delete(name);

        // if no services remain, stop polling
        if (!this.hasAny()) stop_polling();
    }

    clearLocal() {
        this.local.clear();

        if (!this.hasAny()) stop_polling();
    }

    hasAny() {
        return this.global.size + this.local.size > 0;
    }

    names() {
        return [...this.global.keys(), ...this.local.keys()];
    }

    payload() {
        const obj = {};

        // helper: strip functions/undefined (e.g., onData) so payload is serializable
        const toPayload = (svc) => {
            const out = {};

            for (const [k, v] of Object.entries(svc || {})) {
                if (typeof v === 'function') continue;
                if (v === undefined) continue;
                out[k] = v;
            }
            return out;
        };

        // 1) start with globals
        for (const [name, svc] of this.global.entries()) {
            obj[name] = toPayload(svc);
        }

        // 2) overlay locals (locals win on conflicts)
        for (const [name, svc] of this.local.entries()) {
            obj[name] = toPayload(svc);
        }

        return obj;
    }

    dispatch(responses) {
        // responses: { [name]: data }
        for (const [name, data] of Object.entries(responses || {})) {
            const svc = this.local.get(name) || this.global.get(name);

            if (svc) {
                try {
                    // Create a CustomEvent and pass it directly to the callback
                    const evt = new CustomEvent(name, { detail: { data } });
                    svc.onData(evt);
                } catch (e) {
                    console.error('Service onData error', name, e);
                }
            }
        }
    }
}

// ---- Global services registry
const services = new ServiceRegistry();

// ---- Polling / Activity state ----
let service_custom_time = false;
let current_timeout = null;
let last_timeout_delay = null;
let services_timer_cycles = 0;
let last_recorded_activity_at = Date.now();
let inFlightXhr = null;
let consecutive_failures = 0;
const SERVICES_REQUEST_TIMEOUT_MS = 10000;

// ---- various guards
let __services_initialized__ = false; // one-shot init guard
let __services_ready_to_poll__ = false; // flips true on loadcomplete
let __services_polling__ = false; // whether a timer cycle is active/scheduled

// Run cb once when the app is "ready":
// - If SPA emits `loadcomplete`, use that.
// - Else, fall back to native window `load`.
// - If we're already past load, run on a microtask.

function onAppReadyOnce(cb) {
    let done = false;

    const run = () => {
        if (done) return;
        done = true;
        cb();
    };

    // Prefer your SPA signal
    $(window).one('loadcomplete', run);

    // If initial page is already loaded (common during debugging), run now
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(run, 0);
    } else {
        // Fallback for first page load
        $(window).one('load', run);
    }
}

// ===============================
// Init services
// ===============================

function services_init() {
    if (__services_initialized__) return;
    __services_initialized__ = true;

    // console.log('services_init');

    // Register globals & activity monitor once
    // console.log('register_global_services');
    register_global_services();

    // console.log('refresh_timer_on_activity');
    refresh_timer_on_activity();

    // console.log('register loadcomplete');

    // Start polling once the app is ready (first occurrence of: loadcomplete OR load OR already-loaded)
    onAppReadyOnce(() => {
        __services_ready_to_poll__ = true;
        start_polling_if_needed(true /* reset burst */);
    });

    // Attach SPA navigation cleanup once (fires every navigation)
    $(window).on('beforexload', function () {
        // console.log('beforexload');

        // Abort any in-flight request safely
        if (inFlightXhr && inFlightXhr.readyState !== 4) {
            try { inFlightXhr.abort(); } catch (_) {}
        }

        // Clear per-page listeners
        services.clearLocal();

        // Optional: re-enter fast burst when we resume
        services_timer_cycles = 0;

        // If that left zero services, polling stops via clearLocal()
        // If globals remain, polling continues uninterrupted.
    });
}

// ===============================
// Polling control helpers
// ===============================

function start_polling_if_needed(resetBurst = false) {
    // Only start if:
    //  1) we're past loadcomplete,
    //  2) we have services,
    //  3) not already polling.
    if (!__services_ready_to_poll__) return;
    if (!services.hasAny()) return;
    if (__services_polling__) return;

    // console.log('start_polling_if_needed: ', resetBurst ? 'resetBurst' : 'no resetBurst');

    if (resetBurst) services_timer_cycles = 0;
    __services_polling__ = true;
    services_timer();
}

function stop_polling() {
    if (inFlightXhr && inFlightXhr.readyState !== 4) {
        try { inFlightXhr.abort(); } catch (_) {}
    }

    clearTimeout(current_timeout);
    __services_polling__ = false;
}


function services_request_data() {
    // console.log('services_timer');

    if (!services.hasAny()) { // nothing to do → stop
        stop_polling();
        return;
    }

    // If a prior request is still in flight (e.g., activity-driven restart fired
    // before the previous response landed), don't issue another — reschedule.
    if (inFlightXhr && inFlightXhr.readyState !== 4) {
        services_timer();
        return;
    }

    // {"jobs_listener":{}, "chat_listener":{}, ...}
    const payload = services.payload();

    // console.log('get_latest: ', payload);

    inFlightXhr = $.ajax({
        url: '/updates/get_latest',
        data: { services: JSON.stringify(payload) }, // names only
        dataType: 'json',
        // Bound stalled requests so the poll cycle keeps moving when the
        // backend hangs (root cause of ALB 502 / target_status_code "-").
        timeout: SERVICES_REQUEST_TIMEOUT_MS,
        success: function (response) {
            consecutive_failures = 0;
            services.dispatch(response);

            if (services.hasAny()) {
                services_timer();
            } else {
                stop_polling();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // console.log(textStatus, errorThrown);
            consecutive_failures++;

            if (services.hasAny()) {
                services_timer();
            } else {
                stop_polling();
            }
        }
    });
}

function services_timer() {
    // console.log('services_timer');
    last_timeout_delay = services_timer_delay();

    // On consecutive failures, back off exponentially with ±20% jitter to relieve
    // a sick backend and avoid a thundering herd on recovery. Reset on success.
    if (consecutive_failures > 0) {
        const factor = Math.min(Math.pow(2, consecutive_failures), 16);
        const backoff = Math.min(last_timeout_delay * factor, 300000);
        last_timeout_delay = Math.floor(backoff * (0.8 + Math.random() * 0.4));
    }

    schedule_next_tick(last_timeout_delay);
}

function schedule_next_tick(ms) {
    clearTimeout(current_timeout);
    current_timeout = setTimeout(services_request_data, ms);
}

// ===============================
// Activity awareness
// Handle the case where a user is not active and becomes active.
// Don't wait for the current timeout, rather restart it.
// ===============================

function refresh_timer_on_activity() {
    session_activity_monitor(function () {
        last_recorded_activity_at = Date.now();

        // If we're polling and a shorter delay is warranted, restart sooner
        if (__services_polling__ && last_timeout_delay > services_timer_delay()) {
            clearTimeout(current_timeout);
            services_timer();
        }
    });
}

// maybe this should be changed to be more constant

function services_timer_delay() {
    var activity_status = session_activity_status();
    services_timer_cycles++;

    if (activity_status === 'active') {
        if (service_custom_time && (services_timer_cycles <= 100)) {
            return 3000; // every 3 seconds for the first 100 cycles (5 minutes)
        } else if (services_timer_cycles <= 3) { // every 2 seconds for first 3 cycles (6 seconds total)
            return 2000;
        } else if (services_timer_cycles <= 6) { // every 3 seconds for next 3 cycles (9 seconds total)
            return 3000;
        } else if (services_timer_cycles <= 12) { // every 10 seconds for next 6 cycles (1 minute total)
            return 10000;
        } else { // every 20 seconds
            return 20000;
        }
    } else if (activity_status === 'away') {
        return 120000; // 2 minutes
    } else {
        return 1800000; // 30 minutes
    }
}

// Returns the session activity status based on activity on the page
// The session activity status can be:
// “gone” => no activity for at least 30 minutes
// “away” => no activity for at least 5 minutes
// “active” => did something in the past 5 minutes

function session_activity_status() {
    var five = 300000, thirty = 1800000;
    var delta = Date.now() - last_recorded_activity_at;
    if (delta < five) return 'active';
    if (delta < thirty) return 'away';
    return 'gone';
}

// ===============================
// IE hack support for CustomEvent
// ===============================

(function () {
    if (typeof window.CustomEvent === "function") return false; // If not IE

    function CustomEvent(event, params) {
        params = params || {bubbles: false, cancelable: false, detail: undefined};
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
})();

///////////////
// SERVICES: //
///////////////

// ===============================
// Global service registration
// ===============================

function register_global_services() {
    register_notifications_listener();
    register_chat_listener();
    register_jobs_listener();
}

// ===============================
// Notifications listener
// ===============================

function register_notifications_listener() {
    services.register({
        name: 'notifications_listener',
        scope: ServiceScope.GLOBAL,
        onData: (evt) => {
            // console.log('notifications_listener ' + evt.detail.data);
            notifications_listener(evt); // in core.js
        }
    });
}

// ===============================
// Chat listener
// ===============================

function register_chat_listener() {
    services.register({
        name: 'chat_listener',
        scope: ServiceScope.GLOBAL,
        onData: (evt) => {
            chat_listener(evt);
        }
    });
}

function chat_listener(evt) {
    const data = evt.detail.data;

    if (data.chat_from_id != null) {
        display_chat_alert(data.chat_from_id, data.chat_from_name, data.chat_room_id);
    }
}

// ===============================
// Jobs listener
// ===============================

function register_jobs_listener() {
    services.register({
        name: 'jobs_listener',
        scope: ServiceScope.GLOBAL,
        onData: (evt) => {
            jobs_listener(evt);
        }
    });
}

function jobs_listener(evt) {
    const data = evt.detail.data;

    if (data.jobs > 0) {
        $('.jobsHolder.dropDownHolder').show();
        $('.jobsHolder.dropDownHolder .newAlert').text(data.jobs);
    } else {
        $('.jobsHolder.dropDownHolder').hide();
    }
}

// ===============================
// TOC listener
// ===============================

function toc_changed_listener_init(class_id) {
    // console.log('toc_changed_listener_init ' + class_id);

    const activity_service = services.register({
        name: 'toc_changed_listener',
        scope: ServiceScope.LOCAL,
        onData: (evt) => {
            // console.log('toc_changed_listener ' + evt.detail.data);
            toc_changed_listener(evt);
        }
    });

    activity_service['class_id'] = class_id;
}

function toc_changed_listener(e) {
    var data = e.detail.data;

    // console.log("toc_changed_listener data: " + data);

    if (data) {
        window.location.reload();
    }
}

// ==================================
// Class/Group/Path Activity listener
// ==================================

// ===============================
// Called by a widget that wants to get events about activity for a specific container
// type can be "group_activity" or "class_activity" currently
// ===============================
function activity_listener_init(type, id, anonymity) {
    // console.log('activity_listener_init ' + type + ' ' + id + ' ' + anonymity);

    const activity_service = services.register({
        name: 'activity_listener',
        scope: ServiceScope.LOCAL,
        onData: (evt) => {
            // console.log('activity_listener ' + evt.detail.data);
            evt.activity_listener_anonymity = anonymity;
            activity_listener(evt);
        }
    });

    activity_service['anonymity'] = anonymity;
    activity_service[type] = id;
}

// ===============================
// Called by a UI component that wants to be alerted when activity occurs for what it represents,
// such as a lesson tile or an activity widget.
// type can be "class_activity", "group_activity", or "path_activity", or "lesson_activity" currently
// ===============================
function activity_level_listener_register(type, id) {
    // console.log('activity_level_listener_register ' + type + ' ' + id);

    const activity_service = services.register({
        name: 'activity_level_listener',
        scope: ServiceScope.LOCAL,
        onData: (evt) => {
            // console.log('activity_level_listener ' + evt.detail.data);
            activity_level_listener(evt);
        }
    });

    activity_service[type] ||= [];
    activity_service[type].push(id);
}

function activity_level_listener(e) { // this executes when the event was detected
    var data = e.detail.data;

    for (var key in data) {
        // console.log('activity_level_listener 1 ' + key + ', ' + data[key]);
        var category = key;
        var activity = data[key];

        for (var element_id in activity) {
            // console.log('activity_level_listener 2 ' + category + ', ' + element_id + ', ' + activity);
            var target = $('[data-activity="' + category + '_' + element_id + '"]');

            $.each(target, function () {
                var target_image = $(this).find('.imgCrop'); // in case is in tile or row
                var target_indicator = $(this).find('.activity_indicator'); // in case is in widget

                if (target_image.length != 0) {
                    activity_level_append_pulser(target_image, element_id, activity);
                }

                if (target_indicator.length != 0) {
                    activity_level_append_pulser(target_indicator, element_id, activity);
                }
            });
        }
    }
}

function activity_level_append_pulser(target, element_id, activity) {
    // console.log('activity_level_append_pulser ' + element_id + ', ' + activity);
    target.find('.pulse_wrap').remove(); // TODO: replace remove() with removeChild()

    if (activity[element_id].level != 'none') {
        // console.log('append ' + activity[element_id].name);
        target.append("<div class=\"pulse_wrap\" title=\"" + activity[element_id].name + "\"><div class=\"pulse " + activity[element_id].level + "\"><span class=\"textOffScreen\">" + activity[element_id].name + "</span></div></div>");
    }
}

function activity_listener(e) {
    var data = e.detail.data;

    service_custom_time = true;

    for (var key in data) {
        var list_container = $('[data-activity="' + key + '_' + data[key][0] + '"]')
        var list = list_container.find('ul.activity_list');
        var events = data[key][1];
        var new_events = [];
        var timeout = 0;

        if (list_container.length === 0) continue;

        $.each(events, function (index, value) {
            if (list.find('#' + value.uid).length == 0) {
                new_events.push(value.uid);
            }
        });

        if (new_events.length > 0) {
            // remove the empty message
            list.find('#NoActivity').fadeOut(1000, function () {
                $(this).remove(); /* TODO: replace remove() with removeChild() */
            });

            // add each event in the widget with a 1 second slidedown current events and prepend new 1
            // 1100 ms between starting effect and next event effect - 100 ms break
            $.each(new_events, function (index, value) {
                var event;

                $.each(events, function (index1, value1) {
                    if (value1.uid == value) {
                        event = value1;
                        return false;
                    }
                });

                setTimeout(function () {
                    list.prepend("<li class=\"item\" style=\"margin-top:-50px\" id=\"" + event.uid + "\">" +
                        "            <i class=\"" + event.icon + " icnColor\"></i>" +
                        (e.activity_listener_anonymity ? "<span class=\"username\">A user</span>" : "<a href=\"/user/show/" + event.user_id + "\">" + event.user_name + "</a>") +
                        "            <span title=\"" + event.description + "\">" + event.description + "</span>" +
                        "          </li>");

                    $.each(list.find('li'), function (index, value) {
                        if (index > 4) {
                            $(value).remove();
                            return true;
                        }

                        $(value).addClass('sliding'); // add slide animation class which has a 1 sec runtime on all list elements

                        setTimeout(function () {
                            $(value).removeClass('sliding').removeAttr("style");
                        }, 1000); // after the 1 sec animation was done remove the class so it will not start again
                    });
                }, timeout);

                timeout = timeout + 1100;
            });
        }
    }
}
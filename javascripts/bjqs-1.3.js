/*
 * Basic jQuery Slider plug-in v.1.3
 *
 * http://www.basic-slider.com
 *
 * Authored by John Cobb
 * http://www.johncobb.name
 * @john0514
 *
 * Copyright 2011, John Cobb
 * License: GNU General Public License, version 3 (GPL-3.0)
 * http://www.opensource.org/licenses/gpl-3.0.html
 *
 ****** Edited ******
 */

;(function($) {

    "use strict";

    $.fn.bjqs = function(o) {
        
        // slider default settings
        var defaults        = {

            // w + h 
            width           : 700,
            height          : 300,

            // transition valuess
            animtype        : 'fade',
            animduration    : 1000,     // length of transition
            animspeed       : 4000,     // delay between transitions
            automatic       : true,     // enable/disable automatic slide rotation

            // control and marker configuration
            showcontrols    : true,     // enable/disable next + previous UI elements
            centercontrols  : true,     // vertically center controls
            nexttext        : 'Next slide', // screen reader text
            prevtext        : 'Previous slide', // screen reader text
            pausetext       : 'Pause slides',
            playtext        : 'Play slides',
            showmarkers     : false,     // enable/disable individual slide UI markers
            centermarkers   : true,     // horizontally center markers

            // interaction values
            keyboardnav     : true,     // enable/disable keyboard navigation
            hoverpause      : true,     // enable/disable pause slides on hover

            // presentational options
            usecaptions     : true,     // enable/disable captions using img title attribute
            randomstart     : false,    // start from a random slide

        };

        // create settings from defauls and user options
        var settings        = $.extend({}, defaults, o);

        // slider elements
        var $wrapper        = this,
            $slider         = $wrapper.find('ul.bjqs'),
            $slides         = $slider.children('li'),

            // control elements
            $c_wrapper      = null,
            $c_fwd          = null,
            $c_prev         = null,
            $c_pause        = null,

            // marker elements
            $m_wrapper      = null,
            $m_markers      = null,

            // elements for slide animation
            $canvas         = null,
            $clone_first    = null,
            $clone_last     = null;

        // state management object
        var state           = {
            slidecount      : $slides.length,   // total number of slides
            animating       : false,            // bool: is transition is progress
            paused          : false,            // bool: is the slider paused
            currentslide    : o.currentSlide || 1, // current slide being viewed (not 0 based)
            nextslide       : 0,                // slide to view next (not 0 based)
            currentindex    : o.currentSlide || 0,                // current slide being viewed (0 based)
            nextindex       : 0,                // slide to view next (0 based)
            interval        : null              // interval for automatic rotation
        };

        // helpful variables
        var vars            = {
            fwd             : 'forward',
            prev            : 'previous'
        };
            
        // run through options and initialise settings
        var init = function() {
      if(!bjqs_called){
              // differentiate slider li from content li
              $slides.addClass('bjqs-slide');
              conf_static();
  
              // configurations only avaliable if more than 1 slide
              if( state.slidecount > 1 ){
  
                  // enable random start
                  if (settings.randomstart){
                      conf_random();
                  }
  
                  // create and show markers
                  if( settings.showmarkers ){
                      conf_markers();
                  }
  
                  // enable slidenumboard navigation
                  if( settings.keyboardnav ){
                      conf_keynav();
                  }
  
                  // enable pause on hover
                  if (settings.hoverpause && settings.automatic && !$('body').hasClass('accessible_carousel')){
                      conf_hoverpause();
                  }
  
              } else {
                  // Stop automatic animation, because we only have one slide! 
                  settings.automatic = false;
              }
  
              if (settings.usecaptions){
                  conf_captions();
              }
  
              // TODO: need to accomodate random start for slide transition setting
              if (settings.animtype === 'slide' && !settings.randomstart){
                  state.currentindex = 1;
                  state.currentslide = 2;
              }
  
              // slide components are hidden by default, show them now
              $slider.show();
              $slides.eq(state.currentindex).show();
  
              // Finally, if automatic is set to true, kick off the interval
              if (settings.automatic){
                  state.interval = setInterval(function () {
                      go(vars.fwd, false);
                  }, settings.animspeed);
              }
        
        // added - image size recalculation
        new_carousel_height_resize(); 
        
        // create and show controls
        if (settings.showcontrols && state.slidecount > 1){
          conf_controls();
        }
        bjqs_called = true;
      }
        };

    // added - new function added to carousel script
    var new_carousel_height_resize = function() {
      var new_carousel_height = $(window).height() - $('header').outerHeight() - $('footer').outerHeight(),
                img_width           = $(window).width() > 1805 ? 1805 : $(window).width(),
                scaled_img_height   = Math.round( (900 / 1805) * img_width),
                min_img_height      = 570,
                max_img_height

            if ($('body').hasClass('updated-carousel')) {
                max_img_height = 900;

                if ($(window).width() < 1024) {
                    min_img_height = 260;
                    settings.height = scaled_img_height;
                }

                if ($(window).width() < 640) {
                    settings.height = $(window).height() - $('header').height() - $('.mobileLogo').height() + parseInt($('.mobileLogo h1').css("padding-top"));
                }

                // reduce carousel height if it's larger than the max img height
                if (new_carousel_height > max_img_height)
                    new_carousel_height = max_img_height;

                // increase carousel height if it's smaller than the max img height / preset carousel height
                if (new_carousel_height < min_img_height)
                    new_carousel_height = min_img_height;

                if (new_carousel_height < settings.height)
                    new_carousel_height = settings.height;

            } else {
                if ($(window).width() >= 980) {
                    max_img_height = 900; // height of the image used for this size screen
                    settings.height = 560;
                } else if ($(window).width() >= 480) {
                    max_img_height = 499;
                    settings.height = scaled_img_height;
                } else if ($(window).width() >= 320) {
                    max_img_height = 279;
                    settings.height = scaled_img_height + 124;
                    var half_img_width  = img_width/2;
                    var half_link_width = $slider.find('li:first-child .bjqs-caption a').outerWidth() / 2;
                    $slider.find('li:first-child .bjqs-caption a').css('left', (half_img_width - half_link_width) + 'px');
                }

                // reduce carousel height if it's larger than: the scaled img / maximum image height
                if (new_carousel_height > scaled_img_height)
                    new_carousel_height = scaled_img_height;

                if (new_carousel_height > max_img_height)
                    new_carousel_height = max_img_height;

                // increase carousel height if it's smaller than the preset carousel height
                if (new_carousel_height < settings.height)
                    new_carousel_height = settings.height;

            }

            $slides.css({'height'  : new_carousel_height});
      $slider.css({'height'  : new_carousel_height}); 
      $wrapper.css({'height'  : new_carousel_height});  
      $('.carOverlay').css({'height' : new_carousel_height});

      // reposition prev next arrows      
      if ($('.bjqs-next').length > 0 && !$('body').hasClass('accessible_carousel')) {
        position_controls($('.bjqs-next'), $('.bjqs-prev'), new_carousel_height);   
      }
    }
    
        var resize_complete = (function () {            
            var timers = {};
            
            return function (callback, ms, uniqueId) {
                if (!uniqueId) {
                    uniqueId = "Don't call this twice without a uniqueId";
                }
                if (timers[uniqueId]) {
                    clearTimeout (timers[uniqueId]);
                }
                timers[uniqueId] = setTimeout(callback, ms);
            };
        })();

        // enforce fixed sizing on slides, slider and wrapper
        var conf_static = function() {
            $slides.css({
                'height'    : settings.height,
                'width'     : settings.width
            });
            $slider.css({
                'height'    : settings.height,
                'width'     : settings.width
            });
            $wrapper.css({
                'height'    : settings.height
               // 'width'     : settings.width
            });     
      
      // added - window resize img height recalculation
      $(window).resize(function() {
        new_carousel_height_resize();                  
            });
        };

        var conf_controls = function() {
            // create the elements for the controls
            $c_wrapper  = $('<ul class="bjqs-controls"></ul>');
            $c_fwd      = $('<li class="bjqs-next"><a href="#" data-direction="'+ vars.fwd +'"><span class="textOffScreen">'+ settings.nexttext +'</span></a></li>');
            $c_prev     = $('<li class="bjqs-prev"><a href="#" data-direction="'+ vars.prev +'"><span class="textOffScreen">'+ settings.prevtext +'</span></a></li>');
            $c_pause    = $('<li class="bjqs-pause"><a href="#"><span class="textOffScreen">'+ settings.pausetext +'</span></a></li>');

            // bind click events
            $c_wrapper.on('click','a',function(e, param1) {
                e.preventDefault();
                var direction = $(this).attr('data-direction');
                if (param1 == 'intial_pause') direction = undefined;
                if(!state.animating){
                    if(direction === vars.fwd){                        
            go(vars.fwd,false);
                    }
                    if(direction === vars.prev){
                        go(vars.prev,false);
                    }
                    if (direction == undefined && $('body').hasClass('accessible_carousel') && !$('body').hasClass('in_iframe')) {
                        if (!state.paused) {
                            clearInterval(state.interval);
                            state.paused = true;
                            $c_pause.addClass('play');
                            $c_pause.find('.textOffScreen').html(settings.playtext);
                        } else {
                            state.interval = setInterval(function () {
                                go(vars.fwd);
                            }, settings.animspeed);
                            state.paused = false;
                            $c_pause.removeClass('play');
                            $c_pause.find('.textOffScreen').html(settings.pausetext);
                        }
                    } else if (direction == undefined && $('body').hasClass('in_iframe')) {
                        clearInterval(state.interval);
                        state.paused = true;
                        $c_pause.addClass('play');
                        $c_pause.find('.textOffScreen').html(settings.playtext);
                    }
                }
            });

            // put 'em all together
            $c_prev.appendTo($c_wrapper);
            if ($('body').hasClass('accessible_carousel')) {
              $c_pause.insertAfter($c_prev);
            }            
            $c_fwd.appendTo($c_wrapper);
            $c_wrapper.appendTo($wrapper);
            $c_wrapper.addClass('v-centered');
            
            if (!$('body').hasClass('accessible_carousel')) {
              position_controls($c_fwd, $c_prev, $wrapper.height());
            }
        };


        if (!$('body').hasClass('accessible_carousel')) {
          var position_controls = function($c_fwd, $c_prev, wrapper_height) {
          var offset_top,
          offset_left = '8px';
          
          if ($(window).width() < 480) {
              // position vertically center in the img
              if ($('body').hasClass('updated-carousel')) {
                offset_top = "10px";
              } else {
                var img_middle = (wrapper_height - 124) / 2;
                offset_top = img_middle - $c_fwd.find('a').height()/2 + "px";
              }
            } else if ($(window).width() >= 480 && $(window).width() <= 980) {
              // position bottom right
              var offset_left = $wrapper.width() - ($c_fwd.find('a').width() * 2) - 40;
              offset_top  = wrapper_height - $c_fwd.find('a').height() - 10 + 'px';
              
              $c_fwd.find('a').css({'top': offset_top + 'px'});
              $c_prev.find('a').css({'top': offset_top + 'px', 'left': offset_left + 'px'});  
            } else {
              // position vertically center in the carousel
              var wrapper_middle = wrapper_height / 2,    
              offset_top     = wrapper_middle - $c_fwd.find('a').height()/2 + "px"; 
            }
            
            $c_fwd.find('a').css({'top': offset_top});
            $c_prev.find('a').css({'top': offset_top, 'left': offset_left});  
          }
        }

        var conf_markers = function() {
            // create a wrapper for our markers
            $m_wrapper = $('<ol class="bjqs-markers"></ol>');

            // for every slide, create a marker
            $.each($slides, function(key, slide){

                var slidenum    = key + 1,
                    gotoslide   = key + 1;
                
                if(settings.animtype === 'slide'){
                    // + 2 to account for clones
                    gotoslide = key + 2;
                }

                var marker = $('<li><a href="#">'+ slidenum +'</a></li>');

                // set the first marker to be active
                if(slidenum === state.currentslide){ marker.addClass('active-marker'); }

                // bind the click event
                marker.on('click','a',function(e){
                    e.preventDefault();
                    if(!state.animating && state.currentslide !== gotoslide){
                        go(false,gotoslide);
                    }
                });

                // add the marker to the wrapper
                marker.appendTo($m_wrapper);
            });

            $m_wrapper.appendTo($wrapper);
            $m_markers = $m_wrapper.find('li');

            // center the markers
            if (settings.centermarkers) {
                $m_wrapper.addClass('h-centered');
                var offset = (settings.width - $m_wrapper.width()) / 2;
                $m_wrapper.css('left', offset);
            }
        };

        var conf_keynav = function() {
            $(document).keydown(function (event) {
                // Prevent page move when pressing the carousel controls
                if ((event.keyCode == 32 || event.keyCode == 39 || event.keyCode == 37) && $(':focus').parent().parent().hasClass('bjqs-controls')) {
                  event.preventDefault();
                } 
            });
            $(document).keyup(function (event) {
                if ($('body').hasClass('accessible_carousel')) {
                  // Accessible carousel

                  // Class for adding bg colour when user tabbed to the controls
                  if ($(':focus').parent().parent().hasClass('bjqs-controls')) {
                    $('.bjqs-controls').addClass('hover');
                  } else {
                    $('.bjqs-controls').removeClass('hover');
                  }

                  // Press Space when on the pause/play button
                  if (event.keyCode == 32 && $(':focus').parent().hasClass('bjqs-pause')) {
                    if (!state.paused) {
                      clearInterval(state.interval);
                      state.paused = true;
                      $c_pause.addClass('play');
                      $c_pause.find('.textOffScreen').html(settings.playtext);
                      return;
                    } else {
                      state.interval = setInterval(function () {
                        go(vars.fwd);
                      }, settings.animspeed);
                      state.paused = false;
                      $c_pause.removeClass('play');
                      $c_pause.find('.textOffScreen').html(settings.pausetext);
                    }
                  }

                  // Press arrows
                  if (!state.animating) {
                    if (event.keyCode === 39) { /* R */
                      go(vars.fwd, false);
                    } else if (event.keyCode === 37) { /* L */
                      go(vars.prev, false);
                    } 
                  }
                } else {
                  // Non accessible carousel

                  if (!state.paused) {
                    clearInterval(state.interval);
                    state.paused = true;
                  }

                  if (!state.animating) {
                    if (event.keyCode === 39) {
                      event.preventDefault();
                      go(vars.fwd, false);
                    } else if (event.keyCode === 37) {
                      event.preventDefault();
                      go(vars.prev, false);
                    }
                  }

                  if (state.paused && settings.automatic) {
                    state.interval = setInterval(function () {
                      go(vars.fwd);
                    }, settings.animspeed);
                    state.paused = false;
                  }

                }
            });
        };

        var conf_hoverpause = function() {
            $wrapper.hover(function () {
                if (!state.paused) {
                    clearInterval(state.interval);
                    state.paused = true;
                }
            }, function () {
                if (state.paused && !$('body').hasClass('in_iframe')) {
                    state.interval = setInterval(function () {
                        go(vars.fwd, false);
                    }, settings.animspeed);
                    state.paused = false;
                }
            });
        };

        var conf_captions = function() {

            $.each($slides, function (key, slide) {
                var captionTitle =    $(slide).find('img:first-child').data('heading'); // Title
                var captionDes =    $(slide).find('img:first-child').data('description'); // Description
        var captionTitleColour  = $(slide).find('img:first-child').data('title-colour');  // Description Colour
        var captionDesColour  = $(slide).find('img:first-child').data('description-colour');  // Description Colour
                var captionBtnText =  $(slide).find('img:first-child').data('btntext'); // Link Text
                var captionBtnLink =  $(slide).find('img:first-child').data('btnlink'); // Link Href        
        var captionBtnRel  =  $(slide).find('img:first-child').data('btnrel');  // Link Rel 
        var captionBtnTarget  = $(slide).find('img:first-child').data('btntarget');  // Link Target 

                $('<div class="caption-wrapper"><div class="bjqs-caption"></div></div>').appendTo($(slide));
                $('<div class="carOverlay"></div>').appendTo($(slide));

                // show first caption
                if ($(slide).index() == 0) {
                    $(this).find('div.bjqs-caption').addClass('captionCur')
                }

                // Title
                if(!captionTitle){
                    captionTitle = $(slide).find('a img:first-child').attr('title');
                } // Keep title if no caption is present

                if (captionTitle && captionTitle.trim() !== '') {
                    // Check if the title already contains H2 tags (from TinyMCE editor)
                    if (captionTitle.indexOf('<h2') !== -1) {
                        // Content already has H2 tags, append as-is
                        $(slide).find('.bjqs-caption').append(captionTitle);
                    } else {
                        // Plain text content, wrap in H2
                        captionTitle = $('<h2>' + captionTitle + '</h2>');
                        captionTitle.appendTo($(slide).find('.bjqs-caption'));
                    }
                    if (captionTitleColour)
                        $(slide).find('.bjqs-caption h2').css('color', captionTitleColour);
                }

                // Description
                if (captionDes) {
                    captionDes = $('<p>' + captionDes + '</p>');
                    captionDes.appendTo($(slide).find('.bjqs-caption'));
                    if (captionDesColour)
                        $(slide).find('p').css('color', captionDesColour);
                }

                // Link                
                if(!captionBtnText || !captionBtnLink){
                    captionBtnText = $(slide).find('a').find('img:first-child').data('btntext');
                    captionBtnLink = $(slide).find('a').find('img:first-child').data('btnlink');
                } // Keep title if no caption is present

                if (captionBtnText && captionBtnLink) {    
          if (captionBtnRel) {
            captionBtnText = $('<a href="' + captionBtnLink + '" rel="' + captionBtnRel + '" >' + captionBtnText + '</a>');
          } else if (captionBtnTarget) {
            captionBtnText = $('<a href="' + captionBtnLink + '" target="' + captionBtnTarget + '">' + captionBtnText + '</a>');
          } else {
            captionBtnText = $('<a href="' + captionBtnLink + '">' + captionBtnText + '</a>');
          }
                    captionBtnText.appendTo($(slide).find('.bjqs-caption'));
                }
            });
        };

        var conf_random = function() {
            var rand            = Math.floor(Math.random() * state.slidecount) + 1;
            state.currentslide  = rand;
            state.currentindex  = rand-1;
        };

        var set_next = function(direction) {   
      if(direction === vars.fwd){                
                if ($slides.eq(state.currentindex).next().length){
                    state.nextindex = state.currentindex + 1;
                    state.nextslide = state.currentslide + 1;
                } else {
                    state.nextindex = 0;
                    state.nextslide = 1;
                }
            } else {
                if ($slides.eq(state.currentindex).prev().length){
                    state.nextindex = state.currentindex - 1;
                    state.nextslide = state.currentslide - 1;
                } else {
                    state.nextindex = state.slidecount - 1;
                    state.nextslide = state.slidecount;
                }
            }
        };

        var go = function(direction, position) {

            if ($('body').hasClass('in_iframe')) {
                state.currentindex = state.nextindex = $wrapper.find('.bjqs li[style*="list-item"]').index()
            }

            // only if we're not already doing things
            if (!state.animating){
                state.animating = true;
        
                if (position){
                    state.nextslide = position;
                    state.nextindex = position-1;
                } else {
                    set_next(direction);
                }

                // fade animation
                if (settings.animtype === 'fade'){

                    if (settings.showmarkers){
                        $m_markers.removeClass('active-marker');
                        $m_markers.eq(state.nextindex).addClass('active-marker');
                    }       

                    // fade out current
                    $slides.eq(state.currentindex).fadeOut(settings.animduration).find('.bjqs-caption').css('opacity', 0);    
          
          // fade in next slide   
          $slides.eq(state.nextindex).fadeIn(settings.animduration);
          
          // now that the next slide is visible get heights to work with
          var slider_vert_middle  = $slider.height()/2,
            next_caption_height = $slides.eq(state.nextindex).find('.bjqs-caption').outerHeight(),
            half_img_width    = $wrapper.width()/2,
            half_link_width   = $slides.eq(state.nextindex).find('.bjqs-caption a').outerWidth() / 2,
            caption_top         = slider_vert_middle - next_caption_height/2; 
          var caption_start_left,
              caption_end_left;

                    if ($('body').hasClass('updated-carousel')) {
                        if ($(window).width() >= 560)
                            caption_start_left = caption_end_left = 20;
                    } else {
                        if ($(window).width() >= 320)
                            caption_start_left = caption_end_left = 20;
                    }
                    if ($(window).width() >= 980) {
                        caption_start_left = 60;
                        caption_end_left = 110;
                    }
          
          // fade in slide's caption
          $slides.eq(state.nextindex).find('.bjqs-caption').css({opacity: 0, marginLeft: caption_start_left}).delay(500).animate({
              opacity: 1,
              marginLeft: caption_end_left
            }, 1500, function(){                       
              state.animating = false;
              state.currentslide = state.nextslide;
              state.currentindex = state.nextindex;
            })
                }

                // slide animation
                if(settings.animtype === 'slide'){

                    if (settings.showmarkers){
                        
                        var markerindex = state.nextindex-1;

                        if (markerindex === state.slidecount-2){
                            markerindex = 0;
                        } else if (markerindex === -1){
                            markerindex = state.slidecount-3;
                        }

                        $m_markers.removeClass('active-marker');
                        $m_markers.eq(markerindex).addClass('active-marker');
                    }

                    state.slidewidth = settings.width;          
        
                    $slider.animate({'left': -state.nextindex * state.slidewidth }, settings.animduration, function(){
                        state.currentslide = state.nextslide;
                        state.currentindex = state.nextindex;

                        // is the current slide a clone?
                        if ($slides.eq(state.currentindex).attr('data-clone') === 'last'){
                            // affirmative, at the last slide (clone of first)
                            $slider.css({'left': -state.slidewidth });
                            state.currentslide = 2;
                            state.currentindex = 1;
                        } else if($slides.eq(state.currentindex).attr('data-clone') === 'first'){
                            // affirmative, at the fist slide (clone of last)
                            $slider.css({'left': -state.slidewidth *(state.slidecount - 2)});
                            state.currentslide = state.slidecount - 1;
                            state.currentindex = state.slidecount - 2;
                        }

                        state.animating = false;
                    });
                }
            }
        };

        init();
    };
})(jQuery);

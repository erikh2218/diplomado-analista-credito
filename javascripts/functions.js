/**
 * General functions for the LMS pages for both desktop browser and mobile
 * Author: CYPERLEARNING
 * @type {{}}
 */
var Functions = {
    /**
     * Call to run on startup
     */
    init: function() {
        // initialization here
    },

    /**
     * General utility functions
     */
    Helpers: {

        /**
         * Convert RGB color value to Hex string
         * @param colorval rgb format color value
         * @return {string} hex color value
         */
        hexc :function (colorval) {
            // Return null if colorval is null or undefined
            if (!colorval) {
                return null;
            }
            
            // Return as-is if already a hex color
            if (colorval.startsWith('#')) {
                return colorval;
            }
            
            var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            
            // Return null if not a valid RGB format
            if (!parts) {
                return null;
            }

            delete (parts[0]);
            for (var i = 1; i <= 3; ++i) {
                parts[i] = parseInt(parts[i]).toString(16);
                if (parts[i].length == 1) parts[i] = '0' + parts[i];
            }
            return "#" + parts.join('');
        },

        /**
         * Quick pop-up editor for widgets on the page
         * @param target clickable element usually anchor tag
         */
        quick_edit_visibility :function (target) {
            target = target || this;
            var quick_edit_box = target.siblings('.quick_edit_box');
            var box_index = quick_edit_box.attr('id').replace('quick_edit_box_', '');

            // Close all other open quick edit boxes before opening this one
            if (quick_edit_box.css('display') != "block") {
                $('.quick_edit_icon.show').not(target).each(function() {
                    var $this = $(this);
                    var $otherQuickEditBox = $this.siblings('.quick_edit_box');
                    $this.removeClass('show').attr("aria-expanded", false);
                    $otherQuickEditBox.attr('style', 'display:none');
                });
            }

            if (quick_edit_box.css('display') == "block") {
                target.removeClass('show').attr("aria-expanded", false);
                quick_edit_box.attr('style', 'display:none');

                //re-enable drag and drop (firefox windows bug)
                if ($('ui-sortable-disabled').length > 0) {
                    $('.ui-sortable-disabled').sortable('enable');
                }
            } else {
                // show editor box
                target.addClass('show').attr("aria-expanded", true);
                quick_edit_box.attr('style', '').animate({opacity: "1", marginTop: '2px'}, 90, 'easeOutExpo');

                if (quick_edit_box.html().length == 0 || quick_edit_box.parents('.default_image_editor').length > 0) {
                    $.get(target.data('url'), function (data) {
                        quick_edit_box.html(data);

                        // bind save and cancel buttons
                        quick_edit_box.find('#cancel_btn').on('click', function () {
                            Functions.Helpers.quick_edit_visibility($(this).closest('.quick_edit_box').siblings('.quick_edit_icon'), false);
                        });
                        quick_edit_box.find('#save_btn').on('click', function () {
                            Functions.Helpers.quick_edit_visibility($(this).closest('.quick_edit_box').siblings('.quick_edit_icon'), true);
                        });
                        quick_edit_box.find('#reset_btn').on('click', function () {
                            Functions.Helpers.quick_edit_visibility($(this).closest('.quick_edit_box').siblings('.quick_edit_icon'), true);
                        });

                        // set input color dynamically
                        if (quick_edit_box.find('.jscolor').length > 0) {
                            var picker = new jscolor(quick_edit_box.find('.jscolor')[0]);
                            if ($('body').hasClass('catalog_class')) {
                                picker.fromString(Functions.Helpers.hexc($('#leftColumn').css('background-color')));
                            } else if (quick_edit_box.find('.jscolor').length > 0) {
                                var targetElement = $(quick_edit_box).closest('tr').hasClass('modern_module_row') 
                                    ? quick_edit_box.parent().parent() 
                                    : quick_edit_box.parent();

                                // Try to get color from --tile-color-bar first, then fallback to background-color
                                var tileElement = targetElement.attr('data-tile-color-bar') === 'true' 
                                    ? targetElement 
                                    : targetElement.find('[data-tile-color-bar="true"]').first();

                                if (tileElement.length > 0) {
                                    var tileColorBar = window.getComputedStyle(tileElement[0]).getPropertyValue('--tile-color-bar').trim();
                                    if (tileColorBar && tileColorBar !== 'transparent') {
                                        var colorToSet = tileColorBar.startsWith('#') ? tileColorBar : Functions.Helpers.hexc(tileColorBar);
                                        if (colorToSet) {
                                            picker.fromString(colorToSet);
                                        }
                                        return;
                                    }
                                }

                                // Fallback to background color
                                var backgroundColor = targetElement.css('background-color');
                                if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
                                    var backgroundColorHex = Functions.Helpers.hexc(backgroundColor);
                                    if (backgroundColorHex) {
                                        picker.fromString(backgroundColorHex);
                                    }
                                }
                            }
                        }

                        //reset picture button and field
                        quick_edit_box.find('.options_btn').show();
                        quick_edit_box.find('.uploader-list').hide().html('');

                        //disable drag and drop (firefox windows bug)
                        if ($('ui-sortable').length > 0) {
                            $(".ui-sortable").sortable('disable');
                        }
                    });
                }

                if (quick_edit_box.closest('aside').hasClass('rightColumn')) {
                    // Right column widgets
                    var quick_edit_box_bottom = quick_edit_box.siblings('.quick_edit_icon').offset().top + quick_edit_box.siblings('.quick_edit_icon').height() + quick_edit_box.outerHeight();
                    var widget_bottom = quick_edit_box.closest('.widget').offset().top + quick_edit_box.closest('.widget').outerHeight();
                    // Reset
                    quick_edit_box.removeClass('open_upwards');

                    if (quick_edit_box_bottom > widget_bottom && quick_edit_box.closest('.widget').is(':last-child') && !quick_edit_box.closest('.widget').is(':first-child')) {
                        // Overflows container, open upwards
                        quick_edit_box.addClass('open_upwards').animate({opacity: "1", bottom: '36px'}, 90, 'easeOutExpo');
                    }
                }
            }
        },
    },

    /**
     * Functions use for menu operation
     */
    Menu: {

    },
    /**
     * All functions that will be use in mobile app mode
     */
    Mobile: {
        init: function(){
            // Mobile initialization here
        },
    },
};

/**
 * Run Function initialization on startup
 */
$(function () {
    Functions.init();
});


/* Author: Cypher Learning
 Index:
 1. Main Nav Form
 2. RelatedLinks - Active link
 3. Init Modals
 4. Alert Boxes
 5. Fix title wrapping in mobile view, we are also calling this in the mobile app
 6. Select Rubric Radio Button
 7. Dropdowns
 8. Toggle Hidden Content
 9. Add a label after each checkbox / radio button if none and label the ones in the first column of tables
 10. -
 11. iPad Keyboard and Fixed Position Header Fix
 12. Scroll animation
 13. FIx for options in the right on Chrome
 14. Auto-scroll to hide the address bar on iphone safari iOS < 7
 15. Toggle game status detail tables
 16. Mobile Functions
 17. Left Nav Flyouts
 18. Init mobile menu
 // On ready
 19.
 20. Disable fixed position for header and section toolbar on zoom - mobile devices
 21. Resize functions
 22. Add iframe to z-index elements in IE
 23. Load SVG icon sprite
 24. -
 25. add focus trap to facebox
 26. Stop flowplayer when closing facebox
 27. Responsive tables
 28. Show/hide section end links in a lesson
 29. Check portal header scroll
 */

// Keycode array
var key_codes = {tab: 9, enter: 13, esc: 27, space: 32, left: 37, up: 38, right: 39, down: 40};

// This is called at 6.
// But we also need to call this in the mobile app.
function dropdownClickEvents() {
    // inbox dropdown
    $('.messagesHolder > a').off('click').on('click', function (e) {
        if(window.isViewingClassAsStudent) {
            $.alert({title: 'Permission Denied', content: 'You cannot perform this action while viewing as class as another user.'});
            e.stopPropagation();
            return false;
        }

        toggledDownShow(e, this);

        if ($('.messagesHolder > .dropDown').css('left') === '0px') {
            if ($('html').attr('dir') == 'RTL') {
                var left = $('#wrapper').offset().left - $('.messagesHolder > .dropDown').offset().left;
                $('.messagesHolder > .dropDown').css('left', left + 'px');
            } else {
                if (is_mobile_app_mode()) {
                    var left = Math.abs((is_mobile_app_mode() ? globalWindowWidth : $(window).width()) - ($('.messagesHolder > .dropDown').offset().left + $('.messagesHolder > .dropDown').width()));
                } else {
                    var left = Math.abs(($('#wrapper').offset().left + $('#wrapper').width()) - ($('.messagesHolder > .dropDown').offset().left + $('.messagesHolder > .dropDown').width()));
                }
                $('.messagesHolder > .dropDown').css('left', '-' + left + 'px');
            }
        }

        hideDropdown(e, '.jobsHolder .dropDown');
        hideDropdown(e, '.linksHolder .dropDown');
        hideDropdown(e, '.searchHolder .dropDown');
        hideDropdown(e, '.notificationsDropDown');
        call_for_messages('.messagesHolder', 'inbox');
    });

    $('.notificationsHolder > a').off('click').on('click', function (e) {
        if(window.isViewingClassAsStudent) {
            $.alert({title: 'Permission Denied', content: 'You cannot perform this action while viewing as class as another user.'});
            e.stopPropagation();
            return false;
        }

        toggledDownShow(e, this);

        if ($('.notificationsHolder > .dropDown').css('left') === '0px') {
            if ($('html').attr('dir') == 'RTL') {
                var left = $('#wrapper').offset().left - $('.notificationsHolder > .dropDown').offset().left;
                $('.notificationsHolder > .dropDown').css('left', left + 'px');
            } else {
                if (is_mobile_app_mode()) {
                    var left = Math.abs((is_mobile_app_mode() ? globalWindowWidth : $(window).width()) - ($('.notificationsHolder > .dropDown').offset().left + $('.notificationsHolder > .dropDown').width()));
                } else {
                    var left = Math.abs(($('#wrapper').offset().left + $('#wrapper').width()) - ($('.notificationsHolder > .dropDown').offset().left + $('.notificationsHolder > .dropDown').width()));
                }
                $('.notificationsHolder > .dropDown').css('left', '-' + left + 'px');
            }
        }

        hideDropdown(e, '.jobsHolder .dropDown');
        hideDropdown(e, '.linksHolder .dropDown');
        hideDropdown(e, '.searchHolder .dropDown');
        hideDropdown(e, '.messagesDropDown');
        call_for_messages('.notificationsHolder', 'notifications');
    });

  $('.jobsHolder > a').off('click').on('click', function (e) {
    if(window.isViewingClassAsStudent) {
      $.alert({title: 'Permission Denied', content: 'You cannot perform this action while viewing as class as another user.'});
      e.stopPropagation();
      return false;
    }

    toggledDownShow(e, this);

    if ($('.jobsHolder > .dropDown').css('left') === '0px') {
      if ($('html').attr('dir') == 'RTL') {
        var left = $('#wrapper').offset().left - $('.jobsHolder > .dropDown').offset().left;
        $('.jobsHolder > .dropDown').css('left', left + 'px');
      } else {
        if (is_mobile_app_mode()) {
          var left = Math.abs((is_mobile_app_mode() ? globalWindowWidth : $(window).width()) - ($('.jobsHolder > .dropDown').offset().left + $('.jobsHolder > .dropDown').width()));
        } else {
          var left = Math.abs(($('#wrapper').offset().left + $('#wrapper').width()) - ($('.jobsHolder > .dropDown').offset().left + $('.jobsHolder > .dropDown').width()));
        }
        $('.jobsHolder > .dropDown').css('left', '-' + left + 'px');
      }
    }

    hideDropdown(e, '.linksHolder .dropDown');
    hideDropdown(e, '.searchHolder .dropDown');
    hideDropdown(e, '.messagesDropDown');
    hideDropdown(e, '.notificationsDropDown');
    call_for_jobs('.jobsHolder');
  });

    $('.searchHolder > a').off('click').on('click', function (e) {
        toggledDownShow(e, this);
        $('.searchHolder input[type="text"]').focus();
        hideDropdown(e, '.messagesHolder .dropDown');
        hideDropdown(e, '.notificationsHolder .dropDown');
        hideDropdown(e, '.jobsHolder .dropDown');
        hideDropdown(e, '.linksHolder .dropDown');
    });

    $('.linksHolder > a').off('click').on('click', function (e) {
        toggledDownShow(e, this);
        hideDropdown(e, '.messagesHolder .dropDown');
        hideDropdown(e, '.notificationsHolder .dropDown');
        hideDropdown(e, '.jobsHolder .dropDown');
        hideDropdown(e, '.searchHolder .dropDown');
    });

    $('nav#leftColumn .dropDownHolder > a').off('click').on('click', function (e) {
        hideSiblingDropdowns($(this).parent().siblings('li.dropDownHolder'));
        toggledDownShow(e, this);
    });

    $('#Table .dropDownHolder > a').off('click').on('click', function (e) {
        hideSiblingDropdowns($(this).closest('tr').siblings());
        hideDropdown(e, '#TableA .dropDown');
        hideDropdown(e, '#TableB .dropDown');
        toggledDownShow(e, this);
    });

    $('body').on('click', 'table .tableDropdown > a', function (e) {
        hideSiblingDropdowns($(this).closest('tr').siblings());
        toggledDownShow(e, this);

        $(this).parent().css('z-index', '5');
        // Change the z-index of the next 2 dropdown holders so that the don't show on top of the current dropdown
        $(this).closest('tr').next().find('.tableDropdown').css('z-index', '4');
        $(this).closest('tr').next().next().find('.tableDropdown').css('z-index', '4');

        // If the space between the dropdown and the footer is < the dropdown's height then open it upwards instead of downwards
        if (($('footer').offset().top - $(this).siblings('.dropDown').offset().top) < $(this).siblings('.dropDown').outerHeight()) {
            $(this).siblings('.dropDown').css({
                'top': 'auto', 'bottom': '21px'
            });
        }
    });

    $('.optionsRibbon .dropDownHolder > a').off('click').on('click', function (e) {
        toggledDownShow(e, this);
    });

    $('.calendars-picker .calendar-item .dropDownHolder > a').off('click').on('click', function (e) {
        hideSiblingDropdowns($(this).closest('.calendar-item').siblings());
        toggledDownShow(e, this);
        if ($(this).is('[aria-expanded]')) {
            $(this).attr('aria-expanded', $(this).siblings('.dropDown').hasClass('dDownShow'));
        }
        if ($(this).siblings('.dropDown[role="dialog"]').hasClass('dDownShow')) {
            $(this).siblings('.dropDown[role="dialog"]').find('a, button').first().focus();
        }
    }).off('keydown').on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hideSiblingDropdowns($(this).closest('.calendar-item').siblings());
            toggledDownShow(e, this);
            if ($(this).is('[aria-expanded]')) {
                $(this).attr('aria-expanded', $(this).siblings('.dropDown').hasClass('dDownShow'));
            }
            if ($(this).siblings('.dropDown[role="dialog"]').hasClass('dDownShow')) {
                $(this).siblings('.dropDown[role="dialog"]').find('a, button').first().focus();
            }
        }
    });

    function toggledDownShow(e, target) {
        e.preventDefault();
        e.stopPropagation();
        $(target).siblings('.dropDown').toggleClass('dDownShow');
        $(target).toggleClass('highlight');
        if (is_mobile_app_mode()) {
            if ($(target).siblings('.dropDown').hasClass('dDownShow')) {
                $(target).siblings('.dropDown').show();
            } else {
                $(target).siblings('.dropDown').hide();
            }
        }
    }

    $('body, #wrapper').on('click', function (e) { /* change 'document' to 'body' for wide screen clicks on white space and '#wrapper' for iPad */
        if ($('#facebox').has(e.target).length == 0) {
            // Triggers when pressing Enter too so exclude leftColumn so that it doesn't interfere with the flyouts
            hideDropdown(e, 'header .dropDown');
            const openCalendarDropdown = $('.calendars-picker .dropDown[role="dialog"].dDownShow');
            const clickedInsideCalendarDropdown = openCalendarDropdown.length > 0 && (openCalendarDropdown.has(e.target).length > 0 || openCalendarDropdown.is(e.target));
            const clickedActionInCalendarDropdown = openCalendarDropdown.length > 0 && openCalendarDropdown.find('a, button').is(e.target);
            hideDropdown(e, '#centreColumn .dropDown');
            // Dead-space clicks inside the dialog leave it open (APG non-modal dialog).
            // Only close on outside clicks or on interactive elements (isolate link / colour swatch).
            if (openCalendarDropdown.length > 0 && (!clickedInsideCalendarDropdown || clickedActionInCalendarDropdown)) {
                const calTrigger = openCalendarDropdown.siblings('a');
                openCalendarDropdown.removeClass('dDownShow');
                if (clickedActionInCalendarDropdown) {
                    // Action click: restore focus to trigger per APG.
                    // addClass then focus then removeClass: :focus-within keeps the trigger visible
                    // after highlight is stripped (default-styles.css:2471).
                    calTrigger.addClass('highlight').focus().removeClass('highlight');
                } else {
                    // Outside click: leave focus where the user clicked.
                    calTrigger.removeClass('highlight');
                }
                calTrigger.attr('aria-expanded', 'false');
                if (is_mobile_app_mode()) { openCalendarDropdown.hide(); }
            }
        }
    });

    // Used when in .quicklinks, table dropdowns, tabnav dropdowns to trigger the function above
    $('.dropDownHolder .dropDown > a:first-child').bind('keydown', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 9 && e.shiftKey && !$(this).closest('.calendar-item').length) { // tabbed backwards
            $("body").click();
        }
    });
    $('.dropDownHolder .dropDown > a:last-child').bind('keydown', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 9 && !e.shiftKey) { // tabbed forwards
            $("body").click();
        }
    });

    // Close calendar color-picker dropdown when tabbing out of last color
    $('.calendars-picker .calendar-item .color-picker > button:last-child').unbind('keydown.calendarTabForward').bind('keydown.calendarTabForward', function (e) {
        const keyCode = e.keyCode || e.which;
        if (keyCode == 9 && !e.shiftKey) { // tabbed forwards — let Tab carry focus forward, defer close
            const trigger = $(this).closest('.dropDownHolder').children('a');
            const dropdown = $(this).closest('.dropDown');
            setTimeout(function () {
                dropdown.removeClass('dDownShow');
                if (is_mobile_app_mode()) { dropdown.hide(); }
                trigger.attr('aria-expanded', 'false').removeClass('highlight');
            }, 0);
        }
    });
    // Close calendar color-picker dropdown when shift-tabbing out of first element
    $('.calendars-picker .calendar-item .dropDown > :first-child').unbind('keydown.calendarShiftTab').bind('keydown.calendarShiftTab', function (e) {
        const keyCode = e.keyCode || e.which;
        if (keyCode == 9 && e.shiftKey) { // tabbed backwards
            if ($(this).closest('.dropDown').is('[role="dialog"]')) {
                // Dialog: prevent default and restore focus to trigger per APG
                e.preventDefault();
                e.stopImmediatePropagation();
                const trigger = $(this).closest('.dropDownHolder').children('a');
                $(this).closest('.dropDown').removeClass('dDownShow');
                if (is_mobile_app_mode()) { $(this).closest('.dropDown').hide(); }
                trigger.addClass('highlight').attr('aria-expanded', 'false').focus().removeClass('highlight');
            } else {
                // Non-dialog (catalog filter): close directly — visitor_class_catalog has no #centreColumn
                const trigger = $(this).closest('.dropDownHolder').children('a');
                $(this).closest('.dropDown').removeClass('dDownShow');
                if (is_mobile_app_mode()) { $(this).closest('.dropDown').hide(); }
                trigger.removeClass('highlight');
            }
        }
    });

    // Escape closes the calendar options dialog and returns focus to the trigger.
    // Non-delegated so it fires regardless of where focus is (e.g. after a dead-space click
    // moves focus to body, delegation on .dropDownHolder would never match).
    $('body').off('keydown.calendarEscape').on('keydown.calendarEscape', function (e) {
        if (e.key !== 'Escape') { return; }
        const openDialog = $('.calendars-picker .dropDown[role="dialog"].dDownShow');
        if (!openDialog.length) { return; }
        const trigger = openDialog.siblings('a');
        openDialog.removeClass('dDownShow');
        if (is_mobile_app_mode()) { openDialog.hide(); }
        trigger.attr('aria-expanded', 'false').focus().removeClass('highlight');
    });

    // Skip to content links
    $('.skipToContent').on('click', function (e) {
        if ($('body').hasClass('portal')) {
            // Add class for the focus so that focus on shows when using this quick link
            $('.portal #contentWrap').addClass('focus')
        }
        $("html, body").animate({scrollTop: 0}, 10, 'easeOutExpo');
    });
    /* prevent focus highlight on mousedown in the portal, remove special class */
    $('.portal #contentWrap').mousedown(function (e) {
        if (!$(e.target).is("skipToContent")) {
            $(this).removeClass('focus');
        }
    });

    // Same as click function above, but just for Esc key presses in header and #centreColumn
    $(document).keydown(function (e) {
        if (e.keyCode == key_codes.esc) {
            // Close dropDown if controlling link has focus
            $('header a.highlight:focus, #centreColumn a.highlight:focus').removeClass('highlight').siblings('.dropDown').removeClass('dDownShow');
            // Close dropDown & reset focus if an element inside the dropDown has focus
            $('header .dropDown :focus, #centreColumn .dropDown :focus').closest('.dropDown').removeClass('dDownShow').siblings('a').removeClass('highlight').focus();
            // Close special remark dropDown
            $('.special_values_dropdown > .dropDown').removeClass('dDownShow');
            $('.special_values_dropdown').siblings('table').find('.highlighted').removeClass('highlighted');
        }

        // When within open Portal mobile menu
        if ($('body').hasClass('portal') && $(':focus').closest('.mm-opened').length > 0) {
            var main_menu = $("#mm-main-menu");
            if (e.keyCode == key_codes.esc) {
                main_menu.trigger("close.mm");
                $('.portal .leftMobileBar').focus();
            }
            if (main_menu.find('li:last-child > a:focus').length > 0) {
                if (e.keyCode == key_codes.tab) {
                    // trap focus
                    main_menu.find('a:first:visible').focus();
                    came_from_last_link = true;
                    // Focus keeps jumping to the 2nd link after tabbing from the last link so force it to go back to 1st
                    main_menu.find('li:nth-child(2) > a').focus(function(event) {
                        if (came_from_last_link == true) {
                            main_menu.find('li:first-child > a').focus();
                            came_from_last_link = false;
                        }
                    });
                }
            }
        }
    });

    function hideSiblingDropdowns(dropdownHolder) {
        $(dropdownHolder).find('.dropDown').removeClass('dDownShow');
        $(dropdownHolder).find('a').removeClass('highlight');
        $(dropdownHolder).find('a[aria-expanded]').attr('aria-expanded', 'false');
    }

    function hideDropdown(e, dropdownHolder) {
        /* Hides dropdowns when clicking outside them */
        if ($(dropdownHolder).has(e.target).length == 0) {
            $(dropdownHolder).removeClass('dDownShow');
            $(dropdownHolder).siblings('a').removeClass('highlight');
            $(dropdownHolder).closest('.tabnav.vis').removeClass('vis');
        }
    }
}
var globalWindowHeight = window.innerHeight,
  globalWindowWidth = window.innerWidth,
  globalScrollTop = 0;
$(function () {

// 1. Main Nav Form 
    $('form.searchSchoolForm input[type="button"]').on('click', function (e) {
        inputValidation($(this).parent(), e);
    });
    $('body').on('click', 'form.loginForm input[type="button"]', function (e) {
        inputValidation($(this).parent().parent(), e);
    });
    $('body').on('click', 'form.loginFormPopup input[type="button"]', function (e) {
        inputValidation($(this).parent().parent().parent(), e);
    });

    // Press 'return' key to submit login form
    $('body').on('keydown', "form.loginForm", function (e) {
        if (e.which == 13) {
            inputValidation(this, e);
        }
    });
    $('body').on('keydown', "form.loginFormPopup", function (e) {
        if (e.which == 13) {
            inputValidation(this, e);
        }
    });

    function inputValidation(elementName, e) {
        var $textInput = $(elementName).find('input[type="text"]');
        var $textPwd = $(elementName).find('input[type="password"]');

        if ($textInput.val() == '') {
            $textInput.css('border', '1px solid red');
            $textInput.focus();
        } else if ($textPwd.val() == '') {
            $textInput.css('border', '1px solid #C6C5C5');
            $textPwd.css('border', '1px solid red');
            $textPwd.focus();
        } else {
            $(elementName).submit();
            if (typeof e != 'undefined') {
                e.preventDefault();
            }
        }
    }

// 2. Active Link
    var activeData = $('body').data('active');

// 3. Init Modals
    //jQuery('a[rel*=facebox]').facebox();
    if(jQuery.facebox)
        jQuery('a[rel*=facebox]').each(function () {
            if (!jQuery(this).hasClass("_processed")) {
                jQuery(this).addClass("_processed").facebox();
            }
        });

// 4. Alert Boxes
    $(document).on('click', '.alert_block.close_alert > div > a', function (e) {
        $(this).parent().parent().nextAll('.optionsRibbon.optionsRight').hide();
        $(this).parent().parent().animate({
            height: '0', opacity: '0'
        }, 500, function () {
            $(this).css('display', 'none');
            $(this).nextAll('.optionsRibbon.optionsRight').css('top', 0).show();
            if ($('#fixedSectionHeader').length) {
                resizeSectionHeader(true);
            }
        });

        e.preventDefault();
    });
});

// 5. Fix title wrapping in mobile view, we are also calling this in the mobile app

function fix_mobile_title_wrapping() {
    //fix wrapping for title in mobile mode
    $mobileTitleSpan = $('header .mobileBar .middleMobileBar > span');
    if ($mobileTitleSpan.height() > 25) {
        $mobileTitleSpan.css({marginTop: -8, fontSize: '14px'});
    } else {
        $mobileTitleSpan.removeAttr('style');
    }
}

// 6. Select Rubric Radio Button
function init_rubric_editor() {
    $('table.rubric td.rubricHover').on('click', function () {
        $(this).find('input[type="radio"]').prop('checked', true);
        $(this).siblings('td.rubricHover').removeClass("selected");
        $(this).addClass("selected");
    });
}

function to_load(){
    // to_load will load on both ajax complete (excalibur ajax loading) and on jquery load
    // 9. Add a label after each checkbox / radio button if none
    if (!is_mobile_app_mode()) {
        $("input[type='checkbox'], input[type='radio']").each(function (index) {
            if (!$(this).next().is('label')) {
                if ($(this).attr('onclick') == 'toggle_all(this)') {
                    $(this).after('<label for="' + $(this).attr('id') + '"><span class="textOffScreen">Select all</span></label>');
                } else {
                    $(this).after('<label for="' + $(this).attr('id') + '"></label>');
                }

                $(this).addClass('emptyLabel');
            }
        });
        // Find checkboxes/radio buttons within tables
        $("table td input[type='checkbox'].emptyLabel, table td input[type='radio'].emptyLabel").each(function (index) {
            // If the input is in the first column, has an ID and no aria label
            if ($(this).closest('td').is($(this).closest('tr').find("td:first")) && $(this).attr('id') != null && $(this).attr('aria-labelledby') == null) {
                var linked_id = 'aria_label_' + $(this).attr('id');

                // Add aria-labelledby to the input
                $(this).attr('aria-labelledby', linked_id);

                if ($(this).closest('td').next().find('img').length > 0) {
                    // If there is an image in the second column add an ID to the first link in the row
                    $(this).closest('tr').find("a").eq(0).attr('id', linked_id);
                } else {
                    // If not then add an ID to the second column
                    $(this).closest('td').next().attr('id', linked_id);
                }
            }
        });
    }
    window.tabnav_adjustment && window.tabnav_adjustment('#centreColumn');

    if(is_mobile_app_mode()){
        console.log('NATIVE APP: responsive_update on document ready, globalWindowWidth: ' + globalWindowWidth);
    }
    window.responsive_update && responsive_update();

    if(is_mobile_app_mode()){
        console.log('NATIVE APP: tabnav_adjustment on document ready, globalWindowWidth: ' + globalWindowWidth);
    }
    if (typeof options_ribbon_adjustment !== 'undefined') options_ribbon_adjustment();
    if (typeof mobile_section_list_adjustment !== 'undefined') mobile_section_list_adjustment();

    if(!(is_mobile_app_mode() && globalWindowWidth > 768)){
        move_profile_img('table.moveProfileImg img');
        if(globalWindowWidth < 768){
            $('table.mobileOptimized img').each(function(){
                $(this).parent().css({paddingLeft: 0, paddingRight: 0});
            });
        }
    }
    if (typeof move_leftcolumn_img !== 'undefined') {
        !$('.pageHeading #fromLeft').length && move_leftcolumn_img();
    }

    if(window.location.hash && window.location.hash.substr(1,4) == 'help'){
        on_ready(function () {
            $('header .quickLinks i.help').parent().click();
        });
    }

    window.addEventListener('hashchange', function () {
        if (window.location.hash && window.location.hash.substr(1,4) === 'help') $('header .quickLinks i.help').parent().click();
    });

    $(window).trigger('scroll');
    $('.jscolor').length && Excalibur.Location_tools.require_js( '/javascripts/plugins/jscolor/jscolor.min.js?1572868889', function(){
        jscolor.installByClassName("jscolor");
    });

    show_hide_section_end_links();
}

/* Toggle accordion content */
function accordion_heading_link() {
    var panel = $(this).nextAll('.tab-content').first();// nextAll for pages with H2 inbetween

    $(this).siblings('button').attr('aria-expanded', false);
    $(this).siblings('.active').next().attr({'style': '','aria-hidden': true}).removeClass('active-tab');
    $(this).siblings('.active').removeClass('active');

    $(this).toggleClass('active');
    if ($(this).hasClass('active')) {
        $(this).attr('aria-expanded', true);
        panel.attr("aria-hidden", false).addClass('active-tab').css('max-height', panel[0].scrollHeight)
    } else {
        $(this).attr('aria-expanded', false);
        panel.attr({'style': '','aria-hidden': true}).removeClass('active-tab');
    }
}

/* Called at 28 and in to_load */
function show_hide_section_end_links() {
    if ($('.section_end_links').length && $('.sectionLink').length) {
        // Check gap between top and bottom links
        var gap_btwn_links = ($('.section_end_links').offset().top - $('.sectionLink').first().offset().top) + ($('.sectionLink').first().outerHeight() * 3);

        if (gap_btwn_links > globalWindowHeight && globalWindowWidth < 980) {
            $('.section_end_links .sectionLink').css('display', 'inline-flex');
            $('#mainContent .section_end_links').css('display', 'block');
        } else {
            $('.section_end_links .sectionLink').css('display', 'none');
            $('#mainContent .section_end_links').css('display', 'none');
        }

        // Show/hide scroll_indicator_holder in a student lesson
        if ($('body[class*="lesson"] .scroll_indicator_holder').length && $('.max_user_content_width').length) {
            // class=lesson for teacher view which adds it to assignments and lessons
            var scroll_indicator = $('.scroll_indicator_holder');
            var bottom_of_content = $('.max_user_content_width').offset().top + $('.max_user_content_width').outerHeight();
            var margin = $('.max_user_content_width').width()/2 - scroll_indicator.width()/2;
            var margin_side = (is_rtl_mode()) ? 'margin-right' : 'margin-left';

            if (bottom_of_content > globalWindowHeight) {
                scroll_indicator.css(margin_side,margin);
                setTimeout( function(){
                  scroll_indicator.addClass('show');
                }, 700);//prevents animating the left margin
            }
            $((window.mobile_app_mode ? '#contentWrap' : window)).on("scroll",function() {
                scroll_indicator.removeClass('show');
            });
        }
    }
}

$(function () {
    /* Accordion content */
    if (globalWindowWidth < 769) {
        if ($('.catalog_item .accordion_heading').length > 0) {
            $('.tab-content.active-tab').attr('aria-hidden', true).removeClass('active-tab');
        }
    }

// 7. Dropdowns
    dropdownClickEvents();

    $(window).on('loadcomplete', function(){
        setTimeout( function(){
            to_load();
        }, 05);
    });
    to_load();

// 8. Toggle Hidden Content
    $("body").delegate("a.toggleList", "click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        if ($(this).closest('ol').parent('div').length == 0) {
            if (!$(this).parent().next('div').is(':visible')) {
                $(this).parent().next('div').show(); /* show list */

                if ($(this).find('.arrowDown').length > 0) {
                    $(this).hide(); /* hide link if it's an arrow */
                } else {
                    /* for the To-do list where the list opening link stays visible */
                    $(this).attr('aria-expanded', 'true');
                    if ($(this).parent().is(':last-of-type')) {
                        $(this).parent().addClass('keep_border'); /* show border when open */
                    }
                }
            } else {
                $(this).parent().next('div').hide(); /* hide list */

                $(this).attr('aria-expanded', 'false'); /* for the To-do list */
                if ($(this).parent().is(':last-of-type')) {
                    $(this).parent().removeClass('keep_border'); /* hide border when closed */
                }
            }
        } else {
            var $open_list_link = $(this).closest('div').prev().find('a.toggleList');

            if ($open_list_link.find('.arrowDown').length > 0) {
                $open_list_link.show(); /* show link if it's a dropdown arrow */
            } else {
                $open_list_link.attr('aria-expanded', 'false'); /* for the To-do list */
                if ($open_list_link.parent().is(':last-of-type')) {
                    $open_list_link.parent().removeClass('keep_border'); /* hide border when closed */
                }
            }
            $(this).closest('div').hide(); /* hide list */
        }
    });

// 9.

// 10.

// 11. iPad Keyboard and Fixed Position Header Fix
    if (navigator.userAgent.match(/iPad/i) != null && globalWindowWidth > 768) {
        var iOSKeyboardFix = {
            targetElem: $('header'),
            init: function () {
                $("body").on("focus", "input, textarea", function () {
                    if ($(this).parents('header').length == 0 && $(this).parents('#facebox').length == 0) {
                        iOSKeyboardFix.targetElem.css({'position': 'absolute', 'top': 0, 'overflow': 'hidden'});
                        $('input, textarea').on('blur', iOSKeyboardFix.undo);
                        $('#ui-datepicker-div').on("click", "td a", iOSKeyboardFix.undo);
                    }
                });
            },
            undo: function () {
                iOSKeyboardFix.targetElem.css({'position': 'fixed', 'top': 0, 'overflow': 'visible'});
            }
        };

        function facebox_ipad_fix() {
            $(document).bind('reveal.facebox', function () {
                iOSKeyboardFix.targetElem.css({
                    'position': 'absolute',
                    'top': 0,
                    'width': (is_mobile_app_mode() ? globalWindowWidth : $(window).width()),
                    'overflow': 'hidden'
                });
            });
            $(document).bind('close.facebox', function () {
                iOSKeyboardFix.targetElem.css({'position': 'fixed', 'top': 0, 'overflow': 'visible'});
            });
        }

        on_ready(iOSKeyboardFix.init);
        on_ready(facebox_ipad_fix);
    }

// 12. Scroll animation
    if (window.location.href.split("#")[1]) {
        custom_scroll(window.location.href.split("#")[1]);
    }

    if ($('a[href^="%23"]').length > 0) {
        $('a[href^="%23"]').each(function () {
            $(this).attr('href', $(this).attr('href').replace('%23', '#'));
        });
    }

    if ($('a[href^="#"]').length > 0) {
        $('a[href^="#"]').each(function () {
            var el = $(this).attr('href').split('#')[1];

            if (el != '') {
                $(this).on('click', function () {
                    custom_scroll(el);
                });
            }
        });
    }

    function custom_scroll(el) {
        if ($('body').find('[name="' + el + '"]').length != '0') {
            var top;

            if ($(document).find('#fixedSectionHeader').length != '0') {
                top = $('[name="' + el + '"]').offset().top - ($('header').outerHeight() + $('#fixedSectionHeader').outerHeight());
            } else {
                top = $('[name="' + el + '"]').offset().top - $('header').outerHeight();

                if ($.browser.mozilla || $.browser.msie) {
                    top = top - 14;
                }
            }

            $('body,html').animate({scrollTop: top}, 'fast');
        }
    }

// 13. Fix for options in the right on Chrome
    if (/(Chrome|Webkit)/i.test(navigator.userAgent)) {
        $('.optionsRight').css('display', 'table').height();
        $('.optionsRight').css('display', 'block');
    }
// 14. Auto-scroll to hide the address bar on iphone safari iOS < 7
    if (/iPhone;.*CPU.*OS 6_\d/i.test(navigator.userAgent)) {
        addEventListener("load", function () {
            setTimeout(hideURLbar, 10);
        }, false);

        function hideURLbar() {
            window.scrollTo(0, 1);
        }
    }

// 15. Toggle game status detail tables
    $('tr.expandTableRow a').on('click', function () {
        var sliceEnd = $(this).closest('tr').siblings().length;
        var $siblings = $(this).closest('tr').siblings().slice(6, sliceEnd);

        if ($siblings.is(':visible') == false) {
            $(this).find('i').addClass('arrowUp').removeClass('arrowDown');
            $siblings.removeClass('hideRow');
        } else {
            $(this).find('i').addClass('arrowDown').removeClass('arrowUp');
            $siblings.addClass('hideRow');
        }
    });

// 16. Mobile Functions

    /* Up/Down Menu */
    function show_local_menu() {
        $('#user-menu > ol > li.subMenu, #user-menu a#btn-root').show();
        $('#user-menu > ol > li:not(.subMenu):not(.userQuicklinks), #user-menu a#btn-left').hide();
    }

    function hide_local_menu() {
        $('#user-menu > ol > li:not(.subMenu), #user-menu a#btn-left').show();
        $('#user-menu > ol > li.subMenu, #user-menu a#btn-root').hide();
    }

    $("body").delegate("#user-menu a#btn-root", "click", function (e) {
        hide_local_menu();
        e.preventDefault();
    });
    $("body").delegate("#user-menu a#btn-left", "click", function (e) {
        show_local_menu();
        e.preventDefault();
    });

    /* Show/Hide Search */
    $("body").delegate("#user-menu a#btn-search", "click", function (e) {
        $("#user-menu .searchInput").slideDown(200);
        e.preventDefault();
    });
    $("body").delegate("#user-menu a#btn-cancel", "click", function (e) {
        $("#user-menu .searchInput").slideUp(200);
        e.preventDefault();
    });
});
//18. Init mobile menu
function initMobileMenuContent(data) {
    $('body').prepend(data);
    var headings = $('nav#user-menu .dropDownHeading');
    headings.find('a').remove();
    headings.wrapInner('<ul><li class="Label dropDownHeading"></li></ul>').find('ul').unwrap();
    Excalibur.Mobile.Menu.add_submenu($(document.body));
    //add "help for this page" link
    if (get_help_for_page()) {
        $('nav#user-menu ul.helpLinks').prepend(get_help_for_page());
    }
    //highlight current section
    $("nav#user-menu ol > li > ul:first > li > a").each(function () {
        var $elem = $(this);
        if (location.href.indexOf($elem.attr('href')) > -1) {
            $elem.parent().addClass('mm-selected');
            $("nav#user-menu ol > li").removeClass('mm-opened');
            $elem.parent().parent().parent().addClass('mm-opened');
        }
    });
}

function setMobileAppLinks(container) {
    console.log('setMobileAppLinks(' + container + ')');
    $(container + ' a:not([onclick]):not([href=""]):not([href^="#"]):not([target="_blank"]), ' + container + ' button').each(function (index) {
        var href = $(this).attr('href');
        if ((!$.hasData(this) || container == '#user-menu') && typeof $(this).attr('no-loader') == 'undefined' && !$(this).hasClass('no-loader') && (typeof (href) != 'undefined' && href.substring(0, 10) != 'javascript')) {
            if (typeof (href) == 'undefined' || (typeof (href) != 'undefined' && (href.substring(0, 1) == '/' || href.substring(0, 4) == 'http' && href.indexOf(window.location.host) > -1
                )
            )) {
                $(this).click(function () {
                    window.parent.postMessage("{\"method\": \"toggleLoader\", \"action\": \"start\"}", "*");
                });
            } else {
                $(this).click(function () {
                    if (href.indexOf(window.location.origin) < 0) {
                        window.open(href);
                        return false;
                    }
                    //window.parent.postMessage("{\"method\": \"loadBrowser\", \"href\": \"" + href + "\"}", "*");
                });
            }
        }
    });
}

$(function () {

// 19.


// 20. Disable fixed position for header and section toolbar on zoom - mobile devices
    if (is_mobile_device() && $(window).width() > 980) {
        $(window).resize(function () {
            var zoom = document.documentElement.clientWidth / window.innerWidth;
            if (zoom > 1) {
                $('header, #fixedSectionHeader:not(.grade)').css('position', 'absolute');
            } else if (zoom == 1) {
                $('header, #fixedSectionHeader:not(.grade)').css('position', 'fixed');
            }
        });
    }

// 21. Resize functions

    // Catalog item show content
    $('.catalog_item .showLessons a, .catalog_item .showReviews a').on('click', function (e) {
        e.preventDefault();

        if ($(this).parent().siblings('.hide').length > 0) {
            $(this).parent().siblings('.hide').each(function (index) {
                $(this).addClass("show").removeClass("hide");
            });
            $(this).parent().addClass('removeLines');
        } else {
            $(this).parent().siblings('.show').each(function (index) {
                $(this).addClass("hide").removeClass("show");
            });
            $(this).parent().removeClass('removeLines');
        }
        $(this).css('display', 'none').siblings().css('display', 'inline-block');

        if ($('.accordion_heading').is(':visible')) {
          $(this).closest('.active-tab').css('max-height', $(this).closest('.active-tab')[0].scrollHeight);
        }
    });

    //Resize user screen
    $(window).resize(function () {
        // Reposition facebox in the middle
        if ($('#facebox[style*="display"]').length == 0) {
            $('#facebox').css('left', ($(window).width() - $('#facebox').width()) / 2);
        }

        show_hide_section_end_links();

        // Lessons and Catalog tiles have sortable settings. Only need width setting if there's a right col
        if ($('.hasRightColumn .catalog_boxes.ui-sortable').length) {
            $('.hasRightColumn .catalog_boxes').css('width', 'auto');
            $('.hasRightColumn .catalog_boxes').css('width', $('.hasRightColumn .catalog_boxes').width());
        }
    });

// 22. Add iframe to z-index elements in IE
    if (/MSIE|Trident/.test(navigator.userAgent)) {
        var iframe_element = '<iframe style="border:none; position:absolute; top:0; left:0; height:100%; width:100%; z-index:-1;" src="about:blank"></iframe>';
        $(document).bind('reveal.facebox', function () {
            $('#facebox').prepend(iframe_element);
        });
        $('header').prepend(iframe_element);
        $('#fixedSectionHeader').prepend(iframe_element);
    }

    // 23. Load SVG icon sprite
    $.get("/images/icons/main-icons-lrg.svg", function (data) {
        var div = document.createElement("div");
        div.style.display = 'none';
        div.innerHTML = new XMLSerializer().serializeToString(data.documentElement);
        document.body.insertBefore(div, document.body.childNodes[0]);
    });

    // 24. -

    // 25. add focus trap to facebox
    if (!is_mobile_app_mode() && $('html').hasClass('no-touch') && !$('body').hasClass('portal')) {
        $(document).bind('reveal.facebox', function () {
            focusTrap.activate('#facebox', {
                initialFocus: '#facebox'
            });
            $('body').on('mousedown', '#facebox input, #facebox select', deactivate_focus_trap);
        });
        $(document).bind('close.facebox', function () {
            focusTrap.deactivate({returnFocus: false});
        });

        function deactivate_focus_trap(e) {
            focusTrap.deactivate({returnFocus: false});
            $(e.target).focus();
        }
    }

    // 26. Stop flowplayer when closing facebox
    $(document).bind('close.facebox', function () {
        $("#facebox div[id^='flowpv'], #facebox div[id^='flowpa']").each(function (index, element) {
            flowplayer($(element)).stop();
        });
    });

    $('body, #wrapper').on('click', function (e) { /* 'body' - wide screen clicks on white space. '#wrapper' - iPad */
        if (!$(e.target).is('.quick_edit_icon > *, .quick_edit_box, .quick_edit_box *') && !$('input.jscolor').is(':focus') && $('#facebox').has(e.target).length == 0 && $('.modal.is-open').has(e.target).length == 0) {
            // Don't close quick edit boxes if uploader is active or if click is within uploader elements
            if ($('.quick_edit_icon.show').length && !$('#facebox').is(':visible') && !$(e.target).closest('.facebox-content, .resources-scroll, #resources_uploader_form').length) {
                Functions.Helpers.quick_edit_visibility($('.quick_edit_icon.show'), true);
            }
        }
    });

    // 27. Responsive tables
    $('table[class*=inline_table_below_]').each(function () {
        responsive_cell_headers(this);
    });

    // 28. Show/hide section end links in a lesson
    show_hide_section_end_links();

    /* 29. Check portal header scroll */
    function check_portal_scroll() {
        if ($(window).scrollTop() > 20) {
            $('.transparent_header header').addClass('scrolled');
        } else {
            $('.transparent_header header').removeClass('scrolled');
        }
    }
    if ($(window).width() >= 980 && $('.portal header').length > 0) {
        $(window).on("scroll",function() {
            check_portal_scroll();
        });
        $(window).on('touchmove',function(e){
            check_portal_scroll();
        });
        check_portal_scroll();
    }

}); // END - Document ready

function update_tile_color(jscolor) {
    reset_color = false;
    $(jscolor).siblings('button').show();
    //var holder = '#' + jscolor.styleElement.id.split('input').pop();
   // $(holder).closest('.quick_edit_box').parent().css('background-color', '#' + jscolor);
}

function update_catalog_item_color(jscolor) {
    var holder = '#' + jscolor.styleElement.id.split('input').pop(),
        catalog_item_styles = '<style id="catalog_item_color" type="text/css">html:not([dir=rtl]) .catalog_class #contentWrap:before, [dir=rtl] .catalog_class #contentWrap:after, .catalog_class #leftColumn {background-color: #' + jscolor + ' !important}</style>';

    $('head #catalog_item_color').remove();
    $(catalog_item_styles).appendTo($('head'));
}

function accordion_link() {
    var $siblings = this.closest('tr').siblings();

    if ($siblings.length) {
        if ($siblings.is(':visible') == false) {
            show_section_adjustments(this.closest('table'));
        } else {
            hide_section_adjustments(this.closest('table'));
        }
    }
}
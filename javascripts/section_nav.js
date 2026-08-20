var mini_nav;
var wide_nav;

function mini_nav_setting(value) {
  mini_nav = value;
}

function wide_nav_setting(value) {
  wide_nav = value;
}

function section_nav_height() {
  // Set bottom of section nav based on footer position
  var section_nav_bottom = $(window).scrollTop() - ( $('footer').offset().top - globalWindowHeight );

  if (section_nav_bottom > 0) {
    if (is_mobile_device()) {
      section_nav_bottom = section_nav_bottom + ((window.screen.availHeight - globalWindowHeight)/2)
    }
    $('.section_nav_holder .scrollable, #right_nav_holder .right_nav_scroll').css('margin-bottom', section_nav_bottom);
  } else {
    $('.section_nav_holder .scrollable, #right_nav_holder .right_nav_scroll').css('margin-bottom', 0);
  }
}

function position_on_max_width_site() {
  if ($('body.site_full_width').length == 0 && globalWindowWidth >= 1550 || $('body.site_full_width').length > 0 && globalWindowWidth >= 2050) {
    var site_edge = $("#mainContent").offset().left;
    var main_nav_width = 204;// Set width because of CSS transition we can't get the width straight away
    if ($("body").hasClass('keep_tablet_nav')) {
      main_nav_width = 95;
      if ($("body").hasClass('mini_main_nav')) main_nav_width = 63;
    }
    var section_nav_handle_width = $(".section_nav_handle").outerWidth() + 4; // 4 == shadow
    var site_full_width_open_nav_holder = site_edge + main_nav_width;
    var minimum_nav_holder_clip = $(".section_nav_holder").outerWidth() + section_nav_handle_width;
    var gap_outside_site = Math.ceil((globalWindowWidth - $('#wrapper').outerWidth())/2);
    var ltr_left = (is_rtl_mode()) ? 'right' : 'left';
    var ltr_right = (is_rtl_mode()) ? 'left' : 'right';
    var header_padding = parseInt($('#fixedSectionHeader').css('padding-left'));
    var edge = is_rtl_mode() ? - ($(window).width() - $("#leftColumn").offset().left) : ($("#leftColumn").offset().left + $('#leftColumn').outerWidth());

    if ($('body.section_nav_open').length) {
      // Section nav open
      $(".section_nav_holder").css('transform', "translateX(" + edge + "px)");

      if(is_rtl_mode())
        $(".section_nav_holder").css('clip', 'rect(0,' + minimum_nav_holder_clip + 'px, auto, -25px)');
      else
        $(".section_nav_holder").css('clip', 'rect(0,' + minimum_nav_holder_clip + 'px, auto, 0)');
    } else {
      // Closed
      $(".section_nav_holder").css('transform', "translateX(" + parseFloat(edge  - (is_rtl_mode() ? (- $('.section_nav_holder').width()) : $('.section_nav_holder').width())) + "px)");

      if(is_rtl_mode())
        $(".section_nav_holder").css('clip', 'rect(0,' + main_nav_width + 'px, auto, -25px)');
      else
        $(".section_nav_holder").css('clip', 'rect(0,' + main_nav_width + section_nav_handle_width + 'px, auto,' + ($(".section_nav_holder").outerWidth() - main_nav_width) + 'px)');
    }

    if ($('#fixedMarginTop').hasClass('loaded')) {
      $('#fixedSectionHeader').css('width', 'auto');
      $('#fixedSectionHeader').css(ltr_right, gap_outside_site + header_padding + 1);

      if ($('body.section_nav_open').length) {
        $('#fixedSectionHeader').css(ltr_left, gap_outside_site + header_padding + main_nav_width + $(".section_nav_holder").outerWidth());
      } else {
        $('#fixedSectionHeader').css(ltr_left, gap_outside_site + header_padding + main_nav_width);
      }
    }

    $(".section_nav_holder").animate({opacity : 1}, 200);
    $('#fixedSectionHeader, .section_nav_holder').addClass('transition');
    $('#fixedMarginTop').addClass('loaded');/* Safari */
  }
  else {
    $(".section_nav_holder").css('transform', '');
    $('#fixedSectionHeader').css('left', '').css('right', '');
  }
}

/* Open/Close section nav */
function section_nav_handle_click() {
  $('body').toggleClass('section_nav_open');

  if (mini_nav == 'Shown') {
    $('body').toggleClass('mini_main_nav');

    if (wide_nav) {
      if ($('body').hasClass('mini_main_nav'))
        $('body').addClass('keep_tablet_nav');
      else
        $('body').removeClass('keep_tablet_nav');
    }
  }

  if ($('body[class*="teacher"]').length > 0) {
    setTimeout(function() { tabnav_adjustment('#centreColumn'); }, 310)
  }

  if ($('body:not(.evo)').length > 0) {
    // Update #contentWrap min-height when you toggle the section nav
    Excalibur.Mobile.Menu.scroll_helper()
  }

  position_on_max_width_site();

  $.ajax({
    url : '/account/set_show_table_contents?value=' + $('body').hasClass('section_nav_open'),
    type : 'POST'
  });
};
// Add accordion functionality
function toggle_accordion_icon(holder, boolean = false) {
  var holder = holder.closest('li');
  var all_modules = (holder.length == 1) ? false : true;
  var expand_all = boolean;
  var modules_nav_count = $('.section_nav.has_accordion .scrollable > ul > li').length;

  if ((!all_modules && holder.find('button').attr('aria-expanded') == 'true' && modules_nav_count > 1) || all_modules && !expand_all) {
    holder.find('button').attr('aria-expanded','false');
    holder.removeClass('open');
  } else if (!all_modules || all_modules && expand_all) {
    holder.find('button').attr('aria-expanded','true');
    holder.addClass('open');
  }
  $(".section_nav .scrollable").getNiceScroll().resize();

  // If a module section is selected add or remove the temp highlight on contract to show which section the user is in
  if (!module_is_selected) {
    if ($(current_module).find('button').attr('aria-expanded') == 'true') {
      $('.selected.was_selected').removeClass('selected');
    } else {
      $(current_module).find('.module_link').addClass('selected was_selected');
    }
  }
}

function expand_all() {
  toggle_accordion_icon($('.has_accordion ul button'), true);
}
function contract_all() {
  toggle_accordion_icon($('.has_accordion ul button'), false);

}

// Expand/contract all button settings
function expand_contract_all_click() {
  if (this.find('.expand_all').is(':visible')) {
    expand_all();
    window.expand_toc = true;
  } else {
    contract_all()
    window.expand_toc = false;
  }
  this.find('span').toggle();
}

// Expand/contract module button settings
function expand_contract_click() {
  toggle_accordion_icon(this);
}
function expand_contract_enter(el) {
  if ($(el).prev().hasClass('selected')) {
    $(el).prev().addClass('hovering').addClass('was_selected');
  } else {
    $(el).prev().addClass('hovering').addClass('selected');
  }
}
function expand_contract_leave(el) {
  if ($(el).prev().hasClass('was_selected')) {
    $(el).prev().removeClass('hovering').removeClass('was_selected');
  } else {
    $(el).prev().removeClass('hovering').removeClass('selected');
  }
}

on_ready(function() {
  if( $('.scrollable .expand_contract_all').length < 1 ) {
    window.module_is_selected = ($('.section_nav .selected').hasClass('module_link')) ? true : false;
    window.current_module = (module_is_selected) ? $('.section_nav .selected') : $('.section_nav .selected').closest('ul').parent();
    window.nav_is_accordion = ($('.section_nav').hasClass('has_accordion')) ? true : false;

    if ( typeof current_module === 'undefined' || current_module === null || current_module.length < 1) {
      window.current_module = $('.section_nav');
      window.nav_is_accordion = false;
    }
    // Set accordion nav state
    if (nav_is_accordion) {
      if ($('.scrollable > ul').children().length > 1) {
        $('.scrollable').prepend('<button class="expand_contract_all" excalibur-click="expand_contract_all_click"> \
                                <span class="expand_all"><i class="arrowDown"></i>' + expand_all_text + '</span> \
                                <span class="contract_all" style="display: none"><i class="arrowUp"></i>' + contract_all_text + '</span> \
                              </button>');
      }
      $('.section_nav.has_accordion .scrollable > ul > li').each(function (index) {
        if ($(this).find('.module_sections').children().length > 0) {
          $(this).find('.module_sections').prev('.module_link').wrap("<div class='module_wrap'></div>");
          if ($(this).find('.module_wrap > button[aria-controls=\"module_' + index + '\"]').length == 0) {
            $(this).find('.module_wrap').append($('<button class="expand_contract" excalibur-click="expand_contract_click" onmouseenter="expand_contract_enter(this)" onmouseleave="expand_contract_leave(this)" aria-expanded="false" aria-controls="module_' + index + '"><i></i><span class="textOffScreen">Toggle submenu</span></button>'));
          }
          $(this).find('.module_sections').attr('id', 'module_' + index);
        }
      });

      toggle_accordion_icon(current_module);
    }
    /* Ready: check scroll position and show nav */
    section_nav_height();
    position_on_max_width_site();

    // Set section nav scroll type
    if (is_mobile_device()) {
      $(".section_nav .scrollable").css({'-webkit-overflow-scrolling': 'touch'});
    } else {
      $(".section_nav .scrollable").niceScroll({
        cursoropacitymax: 0.4,
        cursorborder: "1px solid transparent",
        railalign: (is_rtl_mode() ? 'left' : 'right')
      });
    }

    // Scroll pos
    var section_nav_top = $('.section_nav .scrollable').offset().top,
      current_module_top = $(current_module).offset().top,
      current_module_bottom = current_module_top + $(current_module).closest('li').height(),
      progress_padding = ($('.section_nav .section_progress').length > 0) ? 0 : parseInt($('.section_nav .scrollable').css('padding-top')),
      section_nav_pos = current_module_top - section_nav_top - progress_padding,
      selected_section = $('.section_nav .selected:not(.module_link)');

    // Scroll up the non-accordion nav so the module is at the top
    if (!nav_is_accordion) {
      $(".section_nav .scrollable").scrollTop(section_nav_pos);
    } else {
      if (current_module_bottom > globalWindowHeight) {
        // Scroll it to the top
        $(".section_nav .scrollable").scrollTop((section_nav_pos - 2));
      }
    }

    if (selected_section.length > 0) {
      // If a section is selected
      var selected_section_bot = selected_section.offset().top + selected_section.outerHeight() + 4,
        selected_section_bot_overflow = selected_section_bot - globalWindowHeight,
        selected_section_next_link = selected_section.parent().next().outerHeight(),
        selected_section_next_module = selected_section.closest('li.open').next().children().outerHeight(),
        selected_section_next_height = (selected_section_next_link > 0) ? selected_section_next_link : selected_section_next_module;
      if (selected_section_next_height == undefined) selected_section_next_height = 0;

      if (selected_section_bot > globalWindowHeight) {
        // If it's cut off by the bottom of the page, move up so it shows at the bottom plus the next section/module after it
        if (nav_is_accordion) {
          $(".section_nav .scrollable").scrollTop(section_nav_pos - 2 + selected_section_bot_overflow + selected_section_next_height);
        } else {
          $(".section_nav .scrollable").scrollTop(section_nav_pos + (selected_section_bot - globalWindowHeight + 5));
        }
      }
    }

    $(".section_nav").animate({opacity: 1}, 200);
  }
});

$(window).resize(function() {
  section_nav_height();

  position_on_max_width_site();
  if (globalWindowWidth < 1550) {
    // special settings not needed below 1550
    $('body:not(.site_full_width) .section_nav_holder, body:not(.site_full_width) #fixedSectionHeader').attr('style','');
  }
  if ($('body.site_full_width').length == 0 && globalWindowWidth >= 1550 || $('body.site_full_width').length > 0 && globalWindowWidth >= 2050) {
    $('#fixedSectionHeader, .section_nav_holder').removeClass('transition');
  }
});

$(window).scroll(function() {
  if (globalWindowWidth >= 768) {
    section_nav_height();
  }
});

// Prevent body scroll when in the section nav
var allow_window_scroll = true;

window.addEventListener("wheel", function(e){
  if ($('body.evo').length === 0) {
    !allow_window_scroll && e.preventDefault();
  }
}, {passive: false} );

$(".section_nav .scrollable").mouseenter(function(){
  allow_window_scroll = false;
}).mouseleave(function(){
  allow_window_scroll = true;
});
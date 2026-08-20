// Computed Style ... if it doesn't exist ... IE learns this manually
if (!window.getComputedStyle) {
  window.getComputedStyle = function(el, pseudo) {
    this.el = el;

    this.getPropertyValue = function(prop) {
      var re = /(\-([a-z]){1})/g;

      if (prop == 'float') {
        prop = 'styleFloat';
      }

      if (re.test(prop)) {
        prop = prop.replace(re, function() {
          return arguments[2].toUpperCase();
        });
      }

      return (el.currentStyle[prop] ? el.currentStyle[prop] : null);
    };

    return this;
  };
}
on_ready(function () {
  $(window).on('loadcomplete', function () {
    if (!$('#fixedMarginTop').hasClass("loaded") && !$('#fixedMarginTop').hasClass("static_initially")) {
      $('#fixedMarginTop').addClass("loaded");
    }
  });
});
// Fixed Header Resize
function resizeSectionHeader(window_resize) {
  if( !$(document.body).hasClass('evo') ) {
    // declarations and calculations
    var $this = document.getElementById('fixedSectionHeader');

    if (document.getElementById('contentHeadingWrapper')) {
      var parent = document.getElementById('contentHeadingWrapper');
    } else {
      var parent = document.getElementById('centreColumn');
    }

    // Add a class to #fixedSectionHeader.grade if scrolled
    if ($(window).scrollTop() > 0 && hasClass($this, 'grade') && !hasClass($this, 'scrolled')) {
      $this.className += ' scrolled';
    }

    var width = parent.clientWidth,
        pad = parseInt(window.getComputedStyle(parent, null).getPropertyValue('padding-left')),
        top = parseInt(window.getComputedStyle($this, null).getPropertyValue('padding-top')),
        margin_top, scroll_top = false,
        child = document.createElement('div'),
        pathArray = window.location.pathname.split('/');

    if (!document.getElementById('fixedMarginTop')) {
      // create a special element if not exists
      var element = document.createElement('div');
      element.id = 'fixedMarginTop';
      parent.insertBefore(element, document.getElementById('fixedSectionHeader'));
    } else {
      // use existing element
      var element = document.getElementById('fixedMarginTop');
    }

    // move alerts div in DOM
    var alert = document.getElementById('alerts');
    $this.insertBefore(alert, $this.firstChild);

    // If #fixedSectionHeader doesn't have the .grade class or has both the .grade and .scrolled class
    if (!hasClass($this, 'grade') || (hasClass($this, 'grade scrolled'))) {
      // styling the header to fit the main container
      if (!(is_mobile_app_mode() && width < 980)) {
        $this.style.width = (width - 2 * pad) + 'px';
      }

      // positioning the content by alerts, this way we don't affect the alerts which were under the header and could not be used anymore
      margin_top = ($this.clientHeight);

      // assignments without modules - change to no-module if this can be added to teacher view
      if (!hasClass($this, 'lesson') && !hasClass($this, 'assignment') && document.documentElement.clientWidth >= 980) {
        margin_top = ($this.clientHeight + 2);
      }
    }

    if (!hasClass(document.body, 'section_nav_page') || hasClass(document.body, 'section_nav_page') && document.documentElement.clientWidth < 980) {
      // Doesn't have section_nav_page or does and is less than 980
      // Calculate margin top of the fixed content
      if (document.documentElement.clientWidth > 980) {
        // assignments with no modules on desktop
        element.style.marginTop = (margin_top - top - 2) + 'px';
      } else {
        // lesson and assignment pages below 980
        if (!hasClass(document.body, 'student_scorm')) {
          element.style.marginTop = (margin_top - top) + 'px';
        }
      }

      if (!hasClass($this, 'student') && is_mobile_app_mode()) {
        margin_top += 10;
      }
    } else {
      // Add an empty style element as the CSS looks for this to see if loaded
      element.style = "";
    }

    $this.style.opacity = "1";
  }
  //move_them_up();
}

// Check if element has indicated class
function hasClass(elem, klass) {
  return (" " + elem.className + " " ).indexOf( " " + klass + " " ) > -1;
}

// Cross-Browser scrollTop substitute
function posTop() {
  return typeof window.pageYOffset != 'undefined' ? window.pageYOffset: document.documentElement.scrollTop? document.documentElement.scrollTop: document.body.scrollTop? document.body.scrollTop:0;
}

// moving alerts, warnings and info into header and animating the margin-top dimension ... voodoo
/*function move_them_up() {
  var header = document.getElementById('fixedSectionHeader');
  var top = document.getElementById('fixedMarginTop');
  var center = document.getElementById('centreColumn');
  var element = center.querySelectorAll('.warning:not(i):not(.keepopen)')[0] || center.querySelectorAll('.info:not(i):not(.keepopen)')[0] || center.querySelectorAll('.error:not(i):not(.keepopen)')[0] || null;

  if (element) {
    if (hasClass(element, 'close_alert')) {
      animate_close(element, top, header, false);
    } else {
      animate_close(element, top, header, true);
    }
  }
}*/

// Animation manual(on close event)/auto
/*function animate_close(element, top, header, auto) {
  var style = element.currentStyle || window.getComputedStyle(element);
  var mt = parseInt(style.marginTop), mb = parseInt(style.marginBottom);
  element.style.display = 'none';
  header.insertBefore(element, header.firstChild);
  element.style.display = 'block';
  top.style.marginTop = ( parseInt(top.style.marginTop) + mt + mb + element.offsetHeight ) + 'px';
  var x = header.offsetHeight + 1;

  if (!auto) {
    element.getElementsByTagName('a')[0].addEventListener('click', function() {
      interval_animate(header, top, mt, mb, x);
    });
  } else {
    setTimeout(function() {
      interval_animate(header, top, mt, mb, x);
    }, 5025);
  }
}*/

function interval_animate(header, top, mt, mb, x) {
  var interval = setInterval(function() {
    if (x != header.offsetHeight) {
      top.style.marginTop = parseInt(top.style.marginTop) - (x - header.offsetHeight) + 'px';
      x = header.offsetHeight;
    } else {
      setTimeout(function() {top.style.marginTop = (parseInt(top.style.marginTop) - mt - mb) + 'px';}, 110);
      clearInterval(interval);
    }
  }, 20);
}
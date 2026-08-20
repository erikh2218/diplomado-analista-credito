(function() {
  on_ready(function() {
    var menu = document.getElementById('profile-menu');
    if (!menu) return;

    var container = menu.parentElement;
    var trigger = document.getElementById('profile-menu-trigger');

    function getItems() {
      return Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]')).filter(function(el) {
        return el.offsetParent !== null;
      });
    }

    function closeMenu() {
      menu.classList.remove('dDownShow');
      if (trigger) trigger.classList.remove('highlight');
    }

    if (trigger) {
      trigger.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeMenu();
          return;
        }

        // Enter/Space: toggle menu; if opening, move focus into first item
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var wasOpen = menu.classList.contains('dDownShow');
          trigger.click();
          if (!wasOpen) {
            setTimeout(function() {
              var items = getItems();
              if (items.length) items[0].focus();
            }, 0);
          }
          return;
        }

        // ArrowDown/Up: open menu if needed, then focus first/last item
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var isDown = e.key === 'ArrowDown';
          if (!menu.classList.contains('dDownShow')) {
            trigger.click();
          }
          setTimeout(function() {
            var items = getItems();
            if (!items.length) return;
            (isDown ? items[0] : items[items.length - 1]).focus();
          }, 0);
        }
      });

      new MutationObserver(function() {
        trigger.setAttribute('aria-expanded', menu.classList.contains('dDownShow') ? 'true' : 'false');
      }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    }

    menu.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        if (trigger) trigger.focus();
        return;
      }

      var items = getItems();
      var currentIndex = items.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(currentIndex + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length].focus();
      }
    });

    container.addEventListener('focusout', function(e) {
      if (e.relatedTarget !== null && !container.contains(e.relatedTarget)) {
        closeMenu();
      }
    });
  });
})();

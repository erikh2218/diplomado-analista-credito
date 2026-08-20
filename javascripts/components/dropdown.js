/**
 * Dropdown Module
 * Handles accessibility for the dropdown menu component
 */

class DropdownAccessibility {
  constructor(element) {
    this.element = element;
    this.trigger = this.findTrigger();
    this.menu = element.querySelector('[role="menu"]');
    this.menuItems = [];
    this.focusedIndex = -1;
    this.isOpen = false;
    
    // Only initialize if this is actually a dropdown menu
    if (this.isDropdownMenu()) {
      this.init();
    }
  }

  findTrigger() {
    const popoverTrigger = this.element.querySelector('.popover-trigger');
    if (popoverTrigger) {
      const button = popoverTrigger.querySelector('button');
      if (button) {
        return button;
      }
      return popoverTrigger;
    }
    
    // Fallback to any element with role="button"
    return this.element.querySelector('[role="button"]');
  }

  isDropdownMenu() {
    // Check if this popover contains a dropdown menu
    return this.element.querySelector('.dropdown-menu') !== null;
  }

  init() {
    this.updateMenuItems();
    this.bindEvents();
  }

  updateMenuItems() {
    this.menuItems = Array.from(this.menu?.querySelectorAll('[role="menuitem"]') || []);
  }

  setupMenuFocus() {
    // Make all menu items focusable when menu is open
    this.menuItems.forEach(item => {
      item.setAttribute('tabindex', '0');
    });
  }

  cleanupMenuFocus() {
    // Reset focus management when menu closes
    this.menuItems.forEach(item => {
      item.setAttribute('tabindex', '0'); // Keep them focusable for keyboard accessibility even when the menu is closed
    });
  }

  bindEvents() {
    // Trigger events
    this.trigger?.addEventListener('keydown', (e) => this.handleTriggerKeydown(e));
    
    // Menu events
    this.menu?.addEventListener('keydown', (e) => this.handleMenuKeydown(e));
    
    // Watch for menu changes
    if (this.menu) {
      const observer = new MutationObserver(() => this.updateMenuItems());
      observer.observe(this.menu, { childList: true, subtree: true });
    }

    // Watch for visibility changes to detect when dropdown opens/closes
    if (this.menu) {
      const visibilityObserver = new MutationObserver(() => {
        const isVisible = this.menu.offsetParent !== null;
        if (isVisible && !this.isOpen) {
          this.isOpen = true;
          this.updateMenuItems();
          this.setupMenuFocus();
          this.focusFirstItem();
        } else if (!isVisible && this.isOpen) {
          this.isOpen = false;
          this.focusedIndex = -1;
          this.cleanupMenuFocus();
        }
      });
      visibilityObserver.observe(this.menu, { 
        attributes: true, 
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: true
      });
    }
  }

  handleTriggerKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.isOpen) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
    }
  }

  handleMenuKeydown(event) {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItem(this.focusedIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItem(this.focusedIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusItem(this.menuItems.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedIndex >= 0 && this.menuItems[this.focusedIndex]) {
          this.menuItems[this.focusedIndex].click();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  openDropdown() {
    // Trigger Alpine.js to open the dropdown
    const alpineData = this.element._x_dataStack?.[0];
    if (alpineData && typeof alpineData.open !== 'undefined') {
      alpineData.open = true;
      this.isOpen = true;
    }
  }

  closeDropdown() {
    // Trigger Alpine.js to close the dropdown
    const alpineData = this.element._x_dataStack?.[0];
    if (alpineData && typeof alpineData.open !== 'undefined') {
      alpineData.open = false;
    }
    this.isOpen = false;
    this.focusedIndex = -1;
    
    // Focus the correct trigger element
    if (this.trigger) {
      this.trigger.focus();
    }
  }

  focusFirstItem() {
    if (this.menuItems.length > 0) {
      this.focusedIndex = 0;
      this.menuItems[0].focus();
      this.menuItems[0].scrollIntoView({ block: 'nearest' });
    }
  }

  focusItem(index) {
    if (this.menuItems.length > 0) {
      this.focusedIndex = Math.max(0, Math.min(index, this.menuItems.length - 1));
      this.menuItems[this.focusedIndex].focus();
      this.menuItems[this.focusedIndex].scrollIntoView({ block: 'nearest' });
    }
  }
}

// Initialize dropdown accessibility for dropdown menus only
document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll('.popover .dropdown-menu');
  dropdowns.forEach(dropdown => {
    // Find the parent popover element
    const popover = dropdown.closest('.popover');
    if (popover && !popover.hasAttribute('data-dropdown-accessibility')) {
      popover.setAttribute('data-dropdown-accessibility', 'true');
      new DropdownAccessibility(popover);
    }
  });
});

// Re-initialize when new dropdown menus are added dynamically
(function() {
  if (typeof window.dropdownObserverInitialized === 'undefined') {
    window.dropdownObserverInitialized = true;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a dropdown menu
            if (node.classList?.contains('dropdown-menu')) {
              const popover = node.closest('.popover');
              if (popover && !popover.hasAttribute('data-dropdown-accessibility')) {
                popover.setAttribute('data-dropdown-accessibility', 'true');
                new DropdownAccessibility(popover);
              }
            }
            // Check for dropdown menus within added nodes
            const dropdownMenus = node.querySelectorAll?.('.dropdown-menu') || [];
            dropdownMenus.forEach(dropdown => {
              const popover = dropdown.closest('.popover');
              if (popover && !popover.hasAttribute('data-dropdown-accessibility')) {
                popover.setAttribute('data-dropdown-accessibility', 'true');
                new DropdownAccessibility(popover);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
})();


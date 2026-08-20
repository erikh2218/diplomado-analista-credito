/**
 * TabNav Module
 * Handles responsive tab navigation with dynamic dropdown functionality
 * and ARIA-compliant tab interactions
 */
class TabNav {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.tabs = [];
    this.dropdown = null;
    this.dropdownToggle = null;
    this.dropdownContent = null;
    this.isInitialized = false;

    this.hasEvo = document.body.classList.contains('evo');

    this.boundTabClick = this.handleTabClick.bind(this);
    this.boundTabKeydown = this.handleTabKeydown.bind(this);
    this.boundDropdownToggle = this.handleDropdownToggle.bind(this);
    this.boundDropdownToggleKeydown = this.handleDropdownToggleKeydown.bind(this);
    this.boundDocumentClick = this.handleOutsideClick.bind(this);
    this.boundDropdownContentClick = this.handleDropdownContentClick.bind(this);
    this.boundDocumentKeydown = this.handleDocumentKeydown.bind(this);

    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('TabNav: Container not found');
      return;
    }

    this.container._tabnavInstance = this;

    this.setupElements();
    this.bindEvents();

    this.isInitialized = true;
    this.adjustLayout();
    this.ensureTabSelected();

    setTimeout(() => {
      this.container.classList.remove('overflow-hidden');
    }, 100);

    window.addEventListener('resize', this.debounce(() => {
      if (!this.container.classList.contains('bypass')) {
        this.container.offsetHeight;
        this.adjustLayout();
      }
    }, 50));
  }

  setupElements() {
    this.tabs = Array.from(this.container.querySelectorAll('[role="tab"]'));

    if (this.container.classList.contains('bypass')) return;

    this.dropdown = this.container.querySelector('.tabs_more_link');

    if (!this.dropdown) {
      this.createDropdown();
    } else {
      this.dropdownContent = this.dropdown.querySelector('.dropDown');
      this.dropdownToggle = this.dropdown.querySelector('.dropDownHolder > button');
    }
  }

  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'tabs_more_link tabnav__tab tabnav__dropdown_tab';
    this.dropdown.style.display = 'none';

    const uniqueId = 'tabnav-dropdown-' + Date.now();
    this.dropdown.setAttribute('data-tabnav-dropdown', uniqueId);

    this.dropdown.innerHTML = `
      <div class="dropDownHolder">
        <button aria-label="Toggle dropdown menu" class="tabnav__toggle" role="tab">
          <i class="ellipsis_vertical"></i>
        </button>
        <div class="dropDown" data-dropdown-content="${uniqueId}"></div>
      </div>
    `;

    this.container.appendChild(this.dropdown);

    this.dropdownContent = this.dropdown.querySelector('.dropDown');
    this.dropdownToggle = this.dropdown.querySelector('.dropDownHolder > button');

    if (this.dropdownToggle) {
      this.dropdownToggle.addEventListener('click', this.boundDropdownToggle);
    }
    if (this.dropdownContent) {
      this.dropdownContent.addEventListener('click', this.boundDropdownContentClick);
    }
  }

  bindEvents() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', this.boundTabClick);
      tab.addEventListener('keydown', this.boundTabKeydown);

      // Save focus state before navigation
      tab.addEventListener('click', () => {
        TabNav.saveFocusState(tab);
      });
    });

    if (!this.container.classList.contains('bypass')) {
      document.addEventListener('click', this.boundDocumentClick);
      document.addEventListener('keydown', this.boundDocumentKeydown);

      if (this.dropdownToggle) {
        this.dropdownToggle.addEventListener('click', this.boundDropdownToggle);
        this.dropdownToggle.addEventListener('keydown', this.boundDropdownToggleKeydown);
      }
      if (this.dropdownContent) {
        this.dropdownContent.addEventListener('click', this.boundDropdownContentClick);
      }
    }
  }

  handleTabClick(event) {
    event.preventDefault();
    this.activateTab(event.currentTarget);
  }

  handleTabKeydown(event) {
    const tab = event.currentTarget;
    const tablist = tab.closest('[role="tablist"]');
    const allTabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const isInDropdown = this.dropdownContent?.contains(tab);

    const tabs = isInDropdown 
      ? Array.from(this.dropdownContent.querySelectorAll('[role="tab"]'))
      : allTabs.filter(t => this.isTabVisible(t));

    const currentIndex = tabs.indexOf(tab);
    let targetTab;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        targetTab = currentIndex > 0 ? tabs[currentIndex - 1] : tabs[tabs.length - 1];
        targetTab.focus();
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        targetTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : tabs[0];
        targetTab.focus();
        break;
      case 'Home':
        event.preventDefault();
        tabs[0].focus();
        break;
      case 'End':
        event.preventDefault();
        tabs[tabs.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activateTab(tab);
        TabNav.saveFocusState(tab);
        tab.click();
        if (isInDropdown) {
          this.closeDropdown();
        }
        break;
      case 'Escape':
        if (isInDropdown) {
          event.preventDefault();
          this.closeDropdown();
          if (this.dropdownToggle) {
            this.dropdownToggle.focus();
          }
        }
        break;
    }
  }

  activateTab(tabElement) {
    const $tab = $(tabElement);
    const tablist = $tab.closest('[role="tablist"]');
    const $tabs = tablist.find('[role="tab"]');
    const panelId = $tab.attr('aria-controls');
    const $panel = panelId ? $('#' + panelId) : null;

    $tabs.attr({ 'aria-selected': 'false', tabindex: '-1' });
    $tab.attr({ 'aria-selected': 'true', tabindex: '0' });

    $tabs.removeClass('selected');
    $tab.addClass('selected');

    if ($panel && $panel.length) {
      $('[role="tabpanel"]').attr({ 'aria-hidden': 'true', tabindex: '-1' });
      $panel.attr({ 'aria-hidden': 'false', tabindex: '0' });
    }
  }

  handleDropdownToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.dropdown) return;
    
    const wasActive = this.dropdown.classList.contains('active');
    const isActive = !wasActive;
    const isKeyboardEvent = event.key || event.keyCode;
    
    this.dropdown.classList.toggle('active', isActive);
    if (this.dropdownToggle) {
      this.dropdownToggle.classList.toggle('highlight', isActive);
    }
    if (this.dropdownContent) {
      this.dropdownContent.classList.toggle('dDownShow', isActive);
    }
    if (this.container) {
      this.container.classList.toggle('vis', isActive);
    }

    if (isActive && isKeyboardEvent) {
      const firstDropdownTab = this.dropdownContent.querySelector('[role="tab"]');
      if (firstDropdownTab) {
        // Need to wait for CSS visibility change to take effect
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            firstDropdownTab.setAttribute('tabindex', '0');
            if (this.dropdownToggle) {
              this.dropdownToggle.blur();
            }
            firstDropdownTab.focus();
            if (document.activeElement !== firstDropdownTab) {
              requestAnimationFrame(() => {
                firstDropdownTab.focus();
              });
            }
          });
        });
      }
    }
  }

  handleDropdownToggleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ' || event.keyCode === 13 || event.keyCode === 32) {
      event.preventDefault();
      event.stopPropagation();
      this.handleDropdownToggle(event);
    } else if (event.key === 'Escape' || event.keyCode === 27) {
      event.preventDefault();
      this.closeDropdown();
    }
  }

  handleDocumentKeydown(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && this.dropdown?.classList.contains('active')) {
      event.preventDefault();
      this.closeDropdown();
      if (this.dropdownToggle) {
        this.dropdownToggle.focus();
      }
    }
  }

  handleOutsideClick(event) {
    if (this.dropdown && !this.dropdown.contains(event.target)) {
      this.closeDropdown();
    }
  }

  handleDropdownContentClick(event) {
    const tab = event.target.closest('[role="tab"]');
    if (tab) {
      this.activateTab(tab);
      TabNav.saveFocusState(tab);
      tab.click();
      this.closeDropdown();
    }
  }

  closeDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.remove('active');
    }
    if (this.dropdownToggle) {
      this.dropdownToggle.classList.remove('highlight');
    }
    if (this.dropdownContent) {
      this.dropdownContent.classList.remove('dDownShow');
      
      const dropdownTabs = this.dropdownContent.querySelectorAll('[role="tab"]');
      dropdownTabs.forEach(tab => {
        if (tab.getAttribute('aria-selected') !== 'true') {
          tab.setAttribute('tabindex', '-1');
        }
      });
    }
    if (this.container) {
      this.container.classList.remove('vis');
    }
  }

  adjustLayout() {
    if (this.container.classList.contains('bypass')) return;

    if (!this.dropdown) {
      this.createDropdown();
    }
    if (!this.dropdownContent) return;
    this.container.offsetHeight;

    if (this.hasEvo) {
      this.adjustLayoutNewUI();
    } else {
      this.adjustLayoutOldUI();
    }

    this.updateDropdownVisibility();
  }

  adjustLayoutOldUI() {
    const wrapper = this.container;
    const constraintWidth = this.container.offsetWidth;
    const buffer = 40;
    const maxIterations = 30;
    let iterations = 0;

    // First, check if the selected tab is in the dropdown and move it to visible area
    const selectedTabInDropdown = this.dropdownContent.querySelector('[role="tab"].selected');
    if (selectedTabInDropdown) {
      // Move selected tab to the end of visible tabs (before dropdown)
      wrapper.insertBefore(selectedTabInDropdown, this.dropdown);
    }

    while (iterations < maxIterations) {
      const visibleTabs = Array.from(wrapper.children).filter(child => 
        child.getAttribute('role') === 'tab'
      );
      let totalTabsWidth = 0;
      visibleTabs.forEach(tab => {
        totalTabsWidth += tab.offsetWidth + this.getFlexGap();
      });

      if (constraintWidth >= (totalTabsWidth + buffer)) {
        break;
      }

      const nextTabToMove = this.getLastVisibleTab(wrapper);
      if (!nextTabToMove) {
        break;
      }

      if (nextTabToMove.classList.contains('selected')) {
        // If the selected tab is too large and is the last one, move other tabs to dropdown
        // Find the second-to-last tab to move instead
        const visibleTabsList = Array.from(wrapper.children).filter(child => 
          child.getAttribute('role') === 'tab'
        );
        if (visibleTabsList.length > 1) {
          const secondToLast = visibleTabsList[visibleTabsList.length - 2];
          this.moveTabToDropdown(secondToLast);
        } else {
          // Only one tab and it's selected, keep it
          break;
        }
        iterations++;
        continue;
      } else {
        this.moveTabToDropdown(nextTabToMove);
      }

      iterations++;
    }

    let backIterations = 0;
    const maxBackIterations = 30;

    while (this.dropdownContent.children.length > 0 && backIterations < maxBackIterations) {
      const visibleTabs = Array.from(wrapper.children).filter(child => 
        child.getAttribute('role') === 'tab'
      );
      let totalTabsWidth = 0;
      visibleTabs.forEach(tab => {
        totalTabsWidth += tab.offsetWidth + this.getFlexGap();
      });

      const lastDropdownTab = this.dropdownContent.lastElementChild;
      if (!lastDropdownTab) break;

      const tabWidth = lastDropdownTab.offsetWidth + this.getFlexGap();
      if (constraintWidth >= (totalTabsWidth + tabWidth + buffer)) {
        this.moveTabFromDropdown(lastDropdownTab, wrapper);
      } else {
        break;
      }
      backIterations++;
    }
  }

  adjustLayoutNewUI() {
    let wrapper = this.container.querySelector('.width-wrap');

    // If no .width-wrap found, create it and wrap all children
    if (!wrapper) {
      wrapper = this.createWidthWrapForNewUI();
    }

    const constraintWidth = this.container.offsetWidth;
    const buffer = 70;
    const maxIterations = 30;
    let iterations = 0;

    // First, check if the selected tab is in the dropdown and move it to visible area
    const selectedTabInDropdown = this.dropdownContent.querySelector('[role="tab"].selected');
    if (selectedTabInDropdown) {
      // Move selected tab to the end of the wrapper (last visible position)
      wrapper.appendChild(selectedTabInDropdown);
    }

    while (iterations < maxIterations) {
      wrapper.offsetHeight;

      if (constraintWidth >= (wrapper.scrollWidth + buffer)) {
        break;
      }

      const nextTabToMove = this.getLastVisibleTab(wrapper);

      if (!nextTabToMove) {
        break;
      }

      if (nextTabToMove.classList.contains('selected')) {
        // If the selected tab is too large and is the last one, move other tabs to dropdown
        // Find the second-to-last tab to move instead
        const visibleTabsList = Array.from(wrapper.children).filter(child => 
          child.getAttribute('role') === 'tab'
        );
        if (visibleTabsList.length > 1) {
          const secondToLast = visibleTabsList[visibleTabsList.length - 2];
          this.moveTabToDropdown(secondToLast);
        } else {
          // Only one tab and it's selected, keep it
          break;
        }
        wrapper.offsetHeight;
        iterations++;
        continue;
      } else {
        this.moveTabToDropdown(nextTabToMove);
      }

      iterations++;
    }

    let backIterations = 0;
    const maxBackIterations = 30;

    while (this.dropdownContent.children.length > 0 && backIterations < maxBackIterations) {
      wrapper.offsetHeight;

      if (constraintWidth >= (wrapper.scrollWidth + 220)) {
        const lastDropdownTab = this.dropdownContent.lastElementChild;
        if (lastDropdownTab) {
          this.moveTabFromDropdown(lastDropdownTab, wrapper);
        } else {
          break;
        }
      } else {
        break;
      }
      backIterations++;
    }
  }

  createWidthWrapForNewUI() {
    const wrapper = document.createElement('div');
    wrapper.className = 'width-wrap';
    // FRE-2604 — ARIA-transparent so role="tab" children are semantic children of role="tablist"
    wrapper.setAttribute('role', 'presentation');
    
    // Move all direct children (except dropdown) to the wrapper
    const children = Array.from(this.container.children);
    children.forEach(child => {
      if (!child.classList.contains('tabs_more_link')) {
        wrapper.appendChild(child);
      }
    });
    
    // Insert wrapper before the dropdown (if it exists)
    const dropdown = this.container.querySelector('.tabs_more_link');
    if (dropdown) {
      this.container.insertBefore(wrapper, dropdown);
    } else {
      this.container.appendChild(wrapper);
    }
    
    return wrapper;
  }

  getLastVisibleTab(wrapper) {
    const visibleTabs = Array.from(wrapper.children).filter(child => 
      child.getAttribute('role') === 'tab'
    );
    
    return visibleTabs.length > 0 ? visibleTabs[visibleTabs.length - 1] : null;
  }

  moveTabToDropdown(tab) {
    this.dropdownContent.appendChild(tab);
  }

  moveTabFromDropdown(tab, wrapper) {
    if (this.hasEvo) {
      wrapper.appendChild(tab);
    } else {
      wrapper.insertBefore(tab, this.dropdown);
    }
  }

  updateDropdownVisibility() {
    if (!this.dropdown || !this.dropdownContent) return;
    
    const hasTabsInDropdown = this.dropdownContent.children.length > 0;

    if (hasTabsInDropdown) {
      this.dropdown.style.display = '';
      this.dropdown.classList.remove('active');
    } else {
      this.dropdown.style.display = 'none';
    }
  }

  resetTabs() {
    if (this.container.classList.contains('bypass') || !this.dropdownContent) return;

    const tabsInDropdown = Array.from(this.dropdownContent.children).filter(child => 
      child.getAttribute('role') === 'tab'
    );
    const target = this.container.querySelector('.width-wrap') || this.container;
    tabsInDropdown.forEach(tab => target.appendChild(tab));

    if (this.dropdown.parentNode) {
      this.dropdown.remove();
      this.dropdown = null;
      this.dropdownContent = null;
      this.dropdownToggle = null;
    }
  }

  refresh() {
    this.adjustLayout();
  }

  destroy() {
    this.tabs.forEach(tab => {
      tab.removeEventListener('click', this.boundTabClick);
      tab.removeEventListener('keydown', this.boundTabKeydown);
    });

    document.removeEventListener('click', this.boundDocumentClick);
    document.removeEventListener('keydown', this.boundDocumentKeydown);

    if (this.dropdownToggle) {
      this.dropdownToggle.removeEventListener('click', this.boundDropdownToggle);
      this.dropdownToggle.removeEventListener('keydown', this.boundDropdownToggleKeydown);
    }

    if (this.dropdownContent) {
      this.dropdownContent.removeEventListener('click', this.boundDropdownContentClick);
    }

    this.resetTabs();

    if (this.container) {
      delete this.container._tabnavInstance;
    }

    this.isInitialized = false;
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  ensureTabSelected() {
    if (!this.tabs.length) return;

    const hasSelectedTab = this.tabs.some(tab => 
      tab.getAttribute('aria-selected') === 'true' || tab.classList.contains('selected')
    );

    if (!hasSelectedTab) {
      this.activateTab(this.tabs[0]);
    }
  }

  reorderTabsBySelection(selectedTab) {
    const target = this.container.querySelector('.width-wrap') || this.container;
    selectedTab.remove();
    target.insertBefore(selectedTab, target.firstChild);
    this.tabs = Array.from(this.container.querySelectorAll('[role="tab"]'));
  }

  getFlexGap() {
    const style = window.getComputedStyle(this.container);
    const gap = style.gap || style.columnGap || '0px';
    return parseInt(gap, 10) || 0;
  }

  isTabVisible(tab) {
    if (!tab) return false;

    // Check offsetParent (null for display:none elements)
    if (!tab.offsetParent && tab.tagName !== 'BODY') {
      return false;
    }

    const style = window.getComputedStyle(tab);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    return true;
  }

  static refresh() {
    document.querySelectorAll('.tabnav').forEach(container => {
      const instance = TabNav.getInstance(container);
      if (instance && !container.classList.contains('bypass')) {
        instance.refresh();
      }
    });
  }

  static resetTabs() {
    document.querySelectorAll('.tabnav').forEach(container => {
      const instance = TabNav.getInstance(container);
      if (instance && !container.classList.contains('bypass')) {
        instance.resetTabs();
      }
    });
  }

  static getInstance(container) {
    return container._tabnavInstance || null;
  }

  static initOnContainer(container) {
    if (!container) return null;
    if (TabNav.getInstance(container)) return TabNav.getInstance(container);
    return new TabNav(container);
  }

  static initAll() {
    document.querySelectorAll('.tabnav').forEach(TabNav.initOnContainer);
  }

  static saveFocusState(tab) {
    try {
      const tabId = tab.getAttribute('id');
      const tabHref = tab.getAttribute('href');
      const containerClass = tab.closest('.tabnav')?.className;
      
      if (tabId || tabHref) {
        sessionStorage.setItem('tabnav_last_focus', JSON.stringify({
          id: tabId,
          href: tabHref,
          containerClass: containerClass,
          timestamp: Date.now()
        }));
      }
    } catch (e) {
      // SessionStorage might be unavailable
      console.warn('TabNav: Could not save focus state', e);
    }
  }

  static restoreFocusState() {
    try {
      const savedFocus = sessionStorage.getItem('tabnav_last_focus');
      if (!savedFocus) return false;

      const focusData = JSON.parse(savedFocus);
      
      // Only restore if it's recent (within 5 seconds)
      if (Date.now() - focusData.timestamp > 5000) {
        sessionStorage.removeItem('tabnav_last_focus');
        return false;
      }

      let targetTab = null;

      // Try to find by ID first
      if (focusData.id) {
        targetTab = document.getElementById(focusData.id);
      }

      // Fall back to href if ID not found
      if (!targetTab && focusData.href) {
        targetTab = document.querySelector(`[role="tab"][href="${focusData.href}"]`);
      }

      // Fall back to any tab with matching href in the same container type
      if (!targetTab && focusData.href && focusData.containerClass) {
        const containers = document.querySelectorAll(`.tabnav`);
        containers.forEach(container => {
          if (container.className === focusData.containerClass) {
            const tab = container.querySelector(`[role="tab"][href="${focusData.href}"]`);
            if (tab) targetTab = tab;
          }
        });
      }

      if (targetTab) {
        // Wait for page to settle before focusing
        requestAnimationFrame(() => {
          targetTab.focus();
          // Scroll into view if needed
          targetTab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        
        // Clear the saved state
        sessionStorage.removeItem('tabnav_last_focus');
        return true;
      }

      return false;
    } catch (e) {
      console.warn('TabNav: Could not restore focus state', e);
      return false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  TabNav.initAll();

  // Restore focus after a short delay to ensure all tabs are rendered
  setTimeout(() => {
    TabNav.restoreFocusState();
  }, 100);

  const observer = new MutationObserver(mutations => {
    let hasNewTabs = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.classList?.contains('tabnav')) {
          TabNav.initOnContainer(node);
          hasNewTabs = true;
        } else {
          const tabnavs = node.querySelectorAll?.('.tabnav');
          if (tabnavs?.length > 0) {
            tabnavs.forEach(TabNav.initOnContainer);
            hasNewTabs = true;
          }
        }
      });
    });
    
    // Try to restore focus if new tabs were added (for AJAX/partial loads)
    if (hasNewTabs) {
      setTimeout(() => TabNav.restoreFocusState(), 50);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

window.initTabNav = (selector, options) => {
  const container = document.querySelector(selector);
  return container ? TabNav.initOnContainer(container, options) : null;
};

window.initAllTabNavs = () => {
  TabNav.initAll();
};

window.initializeTabNavsAndSelectFirst = () => {
  document.querySelectorAll('.tabnav').forEach(container => {
    const instance = TabNav.getInstance(container);
    if (instance) instance.ensureTabSelected();
  });
};

window.restoreTabNavFocus = () => {
  return TabNav.restoreFocusState();
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabNav;
}

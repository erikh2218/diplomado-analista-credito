/* ========================================
   WIDGET VIEW MODE JAVASCRIPT

   Handles widget interactivity in non-editor views
   (instructor view and student view)

   Loaded in: html_section/_show.html.erb
   Created: 2025-12-17
   ======================================== */

;(() => {
  'use strict'

  // Reset initialization flag on each script load (handles AJAX navigation)
  // The script is re-loaded on each page, so we need fresh initialization
  window.widgetViewModeInitialized = false

  // Helper to normalize text content
  const normalizeText = (el) => {
    return el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : ''
  }

  const checkIfItemHasContent = (item) => {
    // Widgets or media inside item
    if (item.querySelector('.ui-component') || item.querySelector('img, video, audio, iframe, object, embed')) {
      return true
    }

    // For grid cells: check text beyond placeholder
    const placeholder = item.querySelector('.grid-cell-placeholder')
    if (placeholder) {
      const cellText = normalizeText(item)
      const placeholderText = normalizeText(placeholder)
      return !!(cellText && cellText !== placeholderText)
    }

    // For columns: detect default template content
    const h3 = item.querySelector('h3')
    const p = item.querySelector('p')
    const hasDefaultHeading = h3 && /^Column\s+\d+$/i.test(normalizeText(h3))
    const hasDefaultParagraph = p && /drop widget here or edit text/i.test(normalizeText(p))

    // If text matches the default template exactly, treat as empty
    if (hasDefaultHeading && hasDefaultParagraph) {
      return false
    }

    // Any other non-empty text counts as content
    const itemText = normalizeText(item)
    return !!itemText
  }

  // Mark grids and columns that have actual content with .has-content class
  // Empty ones will be hidden via CSS
  const markLayoutWidgetsWithContent = (container) => {
    // Grids: visible when any cell has non-placeholder text or a nested widget
    container.querySelectorAll('.ui-grid').forEach((grid) => {
      let hasContent = false
      const cells = grid.querySelectorAll('.grid-cell')

      cells.forEach((cell) => {
        if (hasContent) return
        hasContent = checkIfItemHasContent(cell)
      })

      if (hasContent) {
        grid.classList.add('has-content')
      } else {
        grid.classList.remove('has-content')
      }
    })

    // Columns: visible when any column has either a widget or non-default template text
    container.querySelectorAll('.ui-columns').forEach((widget) => {
      let hasContent = false
      const columns = widget.querySelectorAll('.flex-column')

      columns.forEach((column) => {
        if (hasContent) return
        hasContent = checkIfItemHasContent(column)
      })

      if (hasContent) {
        widget.classList.add('has-content')
      } else {
        widget.classList.remove('has-content')
      }
    })
  }

  // Initialize widget view mode when DOM is ready
  const initWidgetViewMode = () => {
    if (window.widgetViewModeInitialized) {
      return
    }
    window.widgetViewModeInitialized = true
    // Check for widget-view-mode container first, fallback to document body
    const viewModeContainer = document.querySelector('.widget-view-mode') || document.body

    // Inject theme variables into widget-view-mode container (same approach as live preview)
    const activeColor =
      getComputedStyle(document.documentElement).getPropertyValue('--active-color').trim() ||
      getComputedStyle(document.body).getPropertyValue('--active-color').trim() ||
      '#24D3A5'
    let activeColorHover =
      getComputedStyle(document.documentElement).getPropertyValue('--active-color-hover').trim() ||
      getComputedStyle(document.body).getPropertyValue('--active-color-hover').trim() ||
      '36, 211, 165'

    // Strip rgb() wrapper if present - we need just the numbers for rgba()
    if (activeColorHover.startsWith('rgb(')) {
      activeColorHover = activeColorHover.replace(/^rgb\(/, '').replace(/\)$/, '')
    }

    viewModeContainer.style.setProperty('--active-color', activeColor)
    viewModeContainer.style.setProperty('--active-color-hover', activeColorHover)
    viewModeContainer.style.setProperty('--active-color-bg-light', `rgba(${activeColorHover}, 0.05)`)

    // Disable contenteditable in view mode
    viewModeContainer.querySelectorAll('[contenteditable="true"]').forEach((el) => {
      el.removeAttribute('contenteditable')
    })

    // Remove paragraph inserters that may have been saved with content
    viewModeContainer.querySelectorAll('.paragraph-inserter').forEach((el) => {
      el.remove()
    })

    // Remove inline inserter edge zones (editor-only UI) that may have been saved with content
    viewModeContainer.querySelectorAll('.grid-row-edge-zone, .grid-col-edge-zone, .column-edge-zone').forEach((el) => {
      el.remove()
    })

    // Note: empty <p> tags inside grid cells and flex columns are preserved
    // as intentional blank-line spacing created by the user.

    // Mark grids/columns with content so they display, hide empty ones
    markLayoutWidgetsWithContent(viewModeContainer)

    viewModeContainer.style.removeProperty('opacity')

    // Remove inline display styles from tab/accordion content (fix for editor-added !important styles)
    viewModeContainer.querySelectorAll('.tab-content, .accordion-content').forEach(function(el) {
      el.style.removeProperty('display');
    });

    // Reset flip boxes to front side (editor may save with .flipped class if back was being edited)
    viewModeContainer.querySelectorAll('.flipbox-container.flipped').forEach(function(container) {
      container.classList.remove('flipped');
    });

    // Auto-size flip boxes to content and enable click-to-flip
    viewModeContainer.querySelectorAll('.flipbox-container').forEach(function(container) {
      // Measure content and set height
      var minHeight = 120;
      var facePadding = 54; // face padding (1.5rem * 2 = 48px) + back border (3px * 2 = 6px)
      var maxH = minHeight;
      var availableWidth = container.offsetWidth - facePadding;
      if (availableWidth > 0) {
        container.querySelectorAll('.flipbox-content').forEach(function(content) {
          var clone = content.cloneNode(true);
          clone.removeAttribute('contenteditable');
          clone.style.cssText =
            'position:absolute !important;visibility:hidden !important;' +
            'display:block !important;height:auto !important;' +
            'max-height:none !important;overflow:visible !important;' +
            'flex:none !important;box-sizing:border-box !important;' +
            'width:' + availableWidth + 'px !important;' +
            'left:-9999px !important;top:-9999px !important;';
          document.body.appendChild(clone);
          var natural = clone.scrollHeight + facePadding;
          clone.remove();
          if (natural > maxH) maxH = natural;
        });
      }
      container.style.height = maxH + 'px';

      container.addEventListener('click', function(e) {
        // Don't flip if clicking on a link or button inside
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
          return
        }
        this.classList.toggle('flipped');
      });
    });

    // Enable accordion expand/collapse
    viewModeContainer.querySelectorAll('.accordion-header, [data-widget-part="accordion-header"]').forEach((header) => {
      header.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Toggle active state on header
        header.classList.toggle('active')

        // Find the content - try multiple methods
        let content = header.nextElementSibling

        // Check if nextElementSibling is the content (by class or data attribute)
        let isContent =
          content &&
          (content.classList.contains('accordion-content') ||
            content.getAttribute('data-widget-part') === 'accordion-content')

        // If nextElementSibling doesn't work, try finding by parent
        if (!isContent) {
          const accordionItem = header.closest('.accordion-item, [data-widget-part="accordion-item"]')
          if (accordionItem) {
            content = accordionItem.querySelector('.accordion-content, [data-widget-part="accordion-content"]')
            isContent = !!content
          }
        }

        if (isContent && content) {
          content.classList.toggle('active')
        }
      })
    })

    // Enable tab switching - works with or without data-tab-index
    const tabHeaders = viewModeContainer.querySelectorAll('.tab-header, [data-widget-part="tab-header"]')

    tabHeaders.forEach((header) => {
      header.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        const tabsWidget = header.closest('.ui-tabs')
        if (!tabsWidget) return

        // Get all headers and contents
        const allHeaders = Array.from(tabsWidget.querySelectorAll('.tab-header, [data-widget-part="tab-header"]'))
        const allContents = Array.from(tabsWidget.querySelectorAll('.tab-content, [data-widget-part="tab-content"]'))

        // Find the index of clicked header
        const clickedIndex = allHeaders.indexOf(header)

        // Remove active class from all
        allHeaders.forEach((h) => {
          h.classList.remove('active')
        })
        allContents.forEach((c) => {
          c.classList.remove('active')
        })

        // Add active class to clicked header
        header.classList.add('active')

        // Activate corresponding content by index
        if (clickedIndex >= 0 && allContents[clickedIndex]) {
          allContents[clickedIndex].classList.add('active')
        }
      })
    })

    // Always reset tabs to show the first tab (saved HTML may have active on a different tab from editing)
    viewModeContainer.querySelectorAll('.ui-tabs').forEach(function (tabsWidget) {
      // Check for both class-based and data-attribute selectors
      const firstHeader = tabsWidget.querySelector('.tab-header, [data-widget-part="tab-header"]')
      const firstContent = tabsWidget.querySelector('.tab-content, [data-widget-part="tab-content"]')
      const hasActiveHeader = tabsWidget.querySelector('.tab-header.active, [data-widget-part="tab-header"].active')
      const hasActiveContent = tabsWidget.querySelector('.tab-content.active, [data-widget-part="tab-content"].active')

      if (firstHeader && !hasActiveHeader) {
        firstHeader.classList.add('active')
      }
      if (firstContent && !hasActiveContent) {
        firstContent.classList.add('active')
      }
    })
  }

  // Run initialization with multiple fallbacks
  const runInit = () => {
    try {
      initWidgetViewMode()
    } catch (error) {
      console.error('[Widget View Mode] Initialization error:', error)
    }
  }

  // Try multiple initialization methods
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit)
  } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // DOM is already ready
    runInit()
  }

  // Fallback: also try after a short delay
  setTimeout(runInit, 100)

  // Also expose globally for manual initialization if needed
  window.initWidgetViewMode = initWidgetViewMode
})()

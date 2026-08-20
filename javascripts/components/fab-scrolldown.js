/***
 * Show the scroll down FAB (Floating Action Button)
 * - when the user has scrolled up in the container and
 * - hide it when the user has scrolled back down to the top.
 */
function showScrollDownFab() {
  const $evo = $('.evo')
  const $fab = $('#fab-scrolldown')
  const $container = $('.scrollable-container')
  const $content = $('.conversation-content')

  // Track if we're currently checking visibility to avoid redundant checks
  let isCheckingVisibility = false

  // Add event listener to monitor content changes
  const contentObserver = new MutationObserver(() => {
    requestAnimationFrame(checkFabVisibilityInContainer)
  })

  // Add observer for the conversation content which may be dynamically updated
  const conversationObserver = new MutationObserver(() => {
    requestAnimationFrame(checkFabVisibilityInContainer)
  })

  // Set up observers for relevant content areas
  function setupObservers() {
    // Observe the main content area
    if ($content.length > 0) {
      contentObserver.observe($content[0], {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    // Also observe the conversation content in tutorial view
    const $conversationContent = $('.conversation-content')
    if ($conversationContent.length > 0) {
      conversationObserver.observe($conversationContent[0], {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }
  }

  // Initial setup
  setupObservers()

  function checkFabVisibilityInContainer() {
    // Prevent multiple simultaneous checks
    if (isCheckingVisibility) return
    isCheckingVisibility = true

    try {
      const scrollHeight = $container[0]?.scrollHeight || 0
      const clientHeight = $container.height() || 0
      const scrollTop = $container.scrollTop() || 0
      const contentHeight = $content.height() || 0

      // Consider content near the bottom (within 25px) as at the bottom
      const atBottom = scrollTop + clientHeight >= scrollHeight - 25

      if ($evo.length === 0) {
        $fab.removeClass('fab-show').addClass('fab-hide')
        $fab.css('display', 'none')
        return
      }

      // Show FAB when there's scrollable content and we're not at the bottom
      if (scrollHeight > clientHeight && !atBottom && contentHeight > 50) {
        if ($fab.css('display') === 'none') {
          $fab.removeClass('fab-hide').addClass('fab-show')
          $fab.css('display', 'flex')
        }
        
      } else {
        // Hide with animation
        if (contentHeight < 50 || $fab.css('display') !== 'none') {
          $fab.removeClass('fab-show').addClass('fab-hide')
          setTimeout(function () {
            if ($fab.hasClass('fab-hide')) {
              $fab.css('display', 'none')
            }
          }, 300)
        }
      }
    } finally {
      isCheckingVisibility = false
    }
  }

  let scrollTimeout
  $container.on('scroll', function () {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(function () {
        checkFabVisibilityInContainer()
        scrollTimeout = null
      }, 100)
    }
  })

  $(window).on('resize', checkFabVisibilityInContainer)

  // Check after page load and any AJAX completions
  $(window).on('load', checkFabVisibilityInContainer)
  $(document).ajaxComplete(checkFabVisibilityInContainer)

  // Initial check after a short delay
  setTimeout(checkFabVisibilityInContainer, 300)

  // Re-check periodically to catch any missed updates
  setInterval(checkFabVisibilityInContainer, 500)

  $fab.on('click', function () {
    $container.animate(
      {
        scrollTop: $container[0].scrollHeight,
      },
      400
    )
  })
}

const MicroModal = (() => {
  'use strict'

  const FOCUSABLE_ELEMENTS = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
    'select:not([disabled]):not([aria-hidden])',
    'textarea:not([disabled]):not([aria-hidden])',
    'button:not([disabled]):not([aria-hidden])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])'
  ]

  class Modal {
    constructor ({
      targetModal,
      triggers = [],
      onShow = () => { },
      onClose = () => { },
      openTrigger = 'data-micromodal-trigger',
      closeTrigger = 'data-micromodal-close',
      openClass = 'is-open',
      disableScroll = true,
      disableFocus = false,
      awaitCloseAnimation = false,
      awaitOpenAnimation = false,
      debugMode = false
    }) {
      // Save a reference of the modal
      this.modal = typeof targetModal === 'string' ? document.getElementById(targetModal) : targetModal

      // Save a reference to the passed config
      this.config = { debugMode, disableScroll, openTrigger, closeTrigger, openClass, onShow, onClose, awaitCloseAnimation, awaitOpenAnimation, disableFocus }

      // Register click events only if pre binding eventListeners
      if (triggers.length > 0) this.registerTriggers(...triggers)

      // pre bind functions for event listeners
      this.onKeydown = this.onKeydown.bind(this)
    }

    /**
     * Loops through all openTriggers and binds click event
     * @param  {array} triggers [Array of node elements]
     * @return {void}
     */
    registerTriggers (...triggers) {
      triggers.filter(Boolean).forEach(trigger => {
        trigger.addEventListener('click', event => this.showModal(event))
      })
    }

    showModal (event = null) {
      this.activeElement = document.activeElement
      this.modal.setAttribute('aria-hidden', 'false')
      this.modal.classList.add(this.config.openClass)
      this.scrollBehaviour('disable')
      this.addEventListeners()

      if (this.config.awaitOpenAnimation) {
        const handler = () => {
          this.modal.removeEventListener('animationend', handler, false)
          this.setFocusToFirstNode()
        }
        this.modal.addEventListener('animationend', handler, false)
      } else {
        this.setFocusToFirstNode()
      }

      this.config.onShow(this.modal, this.activeElement, event)
    }

    closeModal (event = null) {
      const modal = this.modal
      const openClass = this.config.openClass // <- old school ftw

      if (typeof(tinymce) != 'undefined' && tinyPop && typeof tinymce.get === 'function') {
        // Find a dirty editor inside this modal so the unsaved-changes confirm fires for it.
        // Prefer the active editor, but fall back to scanning every editor: a dirty editor that
        // isn't currently focused would otherwise skip the prompt and get torn down silently by
        // the teardown loop below (FRE-1838).
        const dirtyInModal = (tinymce.get() || []).filter((ed) => {
          const el = ed.getElement && ed.getElement();
          return el && modal.contains(el) && ed.isDirty();
        });
        const editor = dirtyInModal.indexOf(tinymce.activeEditor) > -1 ? tinymce.activeEditor : dirtyInModal[0];
        if (editor) {
          editor.windowManager.openUrl({
            title:"Close the editor?",
            url:"/tinymce/close.htm" + ($('html').attr('dir') == 'RTL' ? '?rtl=true' : ''),
            width:500,
            buttons:[{
              type: 'custom',
              text: "Close",
              name: "close",
              classes:"widget btn primary first abs-layout-item close-btn"
            }, {
              type: 'custom',
              text:"Do not close",
              name: "cancel",
              classes:"widget btn primary first abs-layout-item not-close-btn"
            }],
            onAction: (dialog_api, button_element) => {
              switch (button_element.name) {
                case "cancel" :
                  editor.windowManager.close();
                  // Restore modal state after cancel
                  this.modal.setAttribute('aria-hidden', 'false');
                  this.addEventListeners();
                  break;
                case "close" :
                  editor.windowManager.close();
                  editor.destroy();
                  editor.remove();
                  // Proceed with modal close
                  this.modal.setAttribute('aria-hidden', 'true');
                  this.removeEventListeners();
                  this.scrollBehaviour('enable');
                  if (this.activeElement && this.activeElement.focus) {
                    this.activeElement.focus();
                  }
                  this.config.onClose(this.modal, this.activeElement, event);
                  modal.classList.remove(openClass);
                  break;
              }
            }
          });

          // Use MutationObserver to add ARIA attributes to the dialog title - for accessibility
          const observer = new MutationObserver((mutations) => {
            const titleDiv = document.querySelector('.tox-dialog__title');
            if (titleDiv && !titleDiv.hasAttribute('role')) {
              titleDiv.setAttribute('role', 'heading');
              titleDiv.setAttribute('aria-level', '1');
              observer.disconnect();
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true
          });

          return false;
        }
      }

      // Destroy editors in this modal before discarding it: a leaked (registered but detached)
      // editor blocks TinyMCE from re-binding the textarea when the popup reopens (FRE-1838).
      // Copy the list first — remove() mutates tinymce's live editors array.
      if (typeof(tinymce) != 'undefined' && typeof tinymce.get === 'function') {
        (tinymce.get() || []).slice().forEach((ed) => {
          const el = ed.getElement && ed.getElement();
          if (el && modal.contains(el)) {
            ed.remove();
          }
        });
      }

      // Normal close flow when no editor or editor is not dirty
      this.modal.setAttribute('aria-hidden', 'true');
      this.removeEventListeners();
      this.scrollBehaviour('enable');
      if (this.activeElement && this.activeElement.focus) {
        this.activeElement.focus();
      }
      this.config.onClose(this.modal, this.activeElement, event);

      if (this.config.awaitCloseAnimation) {
        this.modal.addEventListener('animationend', function handler () {
          modal.classList.remove(openClass);
          modal.remove();
          modal.removeEventListener('animationend', handler, false);
        }, false);
      } else {
        modal.classList.remove(openClass);
        modal.remove();
      }
    }

    closeModalByIdOrElement (targetModal) {
      this.modal = typeof targetModal === 'string' ? document.getElementById(targetModal) : targetModal
      if (this.modal) this.closeModal()
    }

    scrollBehaviour (toggle) {
      if (!this.config.disableScroll) return
      const body = document.querySelector('body')
      switch (toggle) {
        case 'enable':
          Object.assign(body.style, { overflow: '' })
          break
        case 'disable':
          Object.assign(body.style, { overflow: 'hidden' })
          break
        default:
      }
    }

    addEventListeners () {
      const closeButton = this.modal.querySelector(".modal__close");
      if (closeButton) {
        closeButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.closeModal(event);
        });
      }
      document.addEventListener('keydown', this.onKeydown)
    }


    removeEventListeners () {
      document.removeEventListener('keydown', this.onKeydown)
    }

    onKeydown (event) {
      if (event.keyCode === 27) this.closeModal(event) // esc
      if (event.keyCode === 9) {
        // Datepicker accessibility fix: Allow focus to move inside the datepicker
        const datepicker = document.getElementById('ui-datepicker-div')
        if (datepicker && datepicker.contains(event.target)) return

        this.retainFocus(event) // tab
      }
    }

    getFocusableNodes () {
      const nodes = this.modal.querySelectorAll(FOCUSABLE_ELEMENTS)
      return Array(...nodes)
    }

    /**
     * Tries to set focus on a node which is not a close trigger
     * if no other nodes exist then focuses on first close trigger
     */
    setFocusToFirstNode () {
      if (this.config.disableFocus) return

      const focusableNodes = this.getFocusableNodes()

      // no focusable nodes
      if (focusableNodes.length === 0) return

      // remove nodes on whose click, the modal closes
      // could not think of a better name :(
      const nodesWhichAreNotCloseTargets = focusableNodes.filter(node => {
        return !node.hasAttribute(this.config.closeTrigger)
      })

      if (nodesWhichAreNotCloseTargets.length > 0) nodesWhichAreNotCloseTargets[0].focus()
      if (nodesWhichAreNotCloseTargets.length === 0) focusableNodes[0].focus()
    }

    retainFocus (event) {
      let focusableNodes = this.getFocusableNodes()

      // no focusable nodes
      if (focusableNodes.length === 0) return

      /**
       * Filters nodes which are hidden to prevent
       * focus leak outside modal
       */
      focusableNodes = focusableNodes.filter(node => {
        return (node.offsetParent !== null)
      })

      // if disableFocus is true
      if (!this.modal.contains(document.activeElement)) {
        focusableNodes[0].focus()
      } else {
        const focusedItemIndex = focusableNodes.indexOf(document.activeElement)

        if (event.shiftKey && focusedItemIndex === 0) {
          focusableNodes[focusableNodes.length - 1].focus()
          event.preventDefault()
        }

        if (!event.shiftKey && focusableNodes.length > 0 && focusedItemIndex === focusableNodes.length - 1) {
          focusableNodes[0].focus()
          event.preventDefault()
        }
      }
    }
  }

  /**
   * Modal prototype ends.
   * Here on code is responsible for detecting and
   * auto binding event handlers on modal triggers
   */

  // Keep a map of opened modals
  const activeModals = new Map()

  /**
   * Generates an associative array of modals and it's
   * respective triggers
   * @param  {array} triggers     An array of all triggers
   * @param  {string} triggerAttr The data-attribute which triggers the module
   * @return {array}
   */
  const generateTriggerMap = (triggers, triggerAttr) => {
    const triggerMap = []

    triggers.forEach(trigger => {
      const targetModal = trigger.attributes[triggerAttr].value
      if (triggerMap[targetModal] === undefined) triggerMap[targetModal] = []
      triggerMap[targetModal].push(trigger)
    })

    return triggerMap
  }

  /**
   * Validates whether a modal of the given id exists
   * in the DOM
   * @param  {string|object} modal the html ID of the modal, or the modal element itself
   * @return {boolean}
   */
  const validateModalPresence = modal => {
    if (typeof id === 'string' ? !document.getElementById(modal) : !modal) {
      console.warn(`MicroModal: \u2757Seems like you have missed %c'${ modal }'`, 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', 'ID somewhere in your code. Refer example below to resolve it.')
      console.warn('%cExample:', 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', `<div class="modal" id="${ modal }"></div>`)
      return false
    }
  }

  /**
   * Validates if there are modal triggers present
   * in the DOM
   * @param  {array} triggers An array of data-triggers
   * @return {boolean}
   */
  const validateTriggerPresence = triggers => {
    if (triggers.length <= 0) {
      console.warn('MicroModal: \u2757Please specify at least one %c\'micromodal-trigger\'', 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', 'data attribute.')
      console.warn('%cExample:', 'background-color: #f8f9fa;color: #50596c;font-weight: bold;', '<a href="#" data-micromodal-trigger="my-modal"></a>')
      return false
    }
  }

  /**
   * Checks if triggers and their corresponding modals
   * are present in the DOM
   * @param  {array} triggers   Array of DOM nodes which have data-triggers
   * @param  {array} triggerMap Associative array of modals and their triggers
   * @return {boolean}
   */
  const validateArgs = (triggers, triggerMap) => {
    validateTriggerPresence(triggers)
    if (!triggerMap) return true
    for (const id in triggerMap) validateModalPresence(id)
    return true
  }

  /**
   * Binds click handlers to all modal triggers
   * @param  {object} config [description]
   * @return void
   */
  const init = config => {
    // Create an config object with default openTrigger
    const options = Object.assign({}, { openTrigger: 'data-micromodal-trigger' }, config)

    // Collects all the nodes with the trigger
    const triggers = [...document.querySelectorAll(`[${ options.openTrigger }]`)]

    // Makes a mappings of modals with their trigger nodes
    const triggerMap = generateTriggerMap(triggers, options.openTrigger)

    // Checks if modals and triggers exist in dom
    if (options.debugMode === true && validateArgs(triggers, triggerMap) === false) return

    // For every target modal creates a new instance
    for (const key in triggerMap) {
      const value = triggerMap[key]
      options.targetModal = key
      options.triggers = [...value]
      activeModals.set(key, new Modal(options)) // eslint-disable-line no-new
    }
  }

  /**
   * Shows a particular modal
   * @param  {string|object} targetModal [The id of the modal to display]
   * @param  {object} config [The configuration object to pass]
   * @return {void}
   */
  const show = (targetModal, config) => {
    const options = config || {}
    options.targetModal = targetModal

    // Checks if modals and triggers exist in dom
    if (options.debugMode === true && validateModalPresence(targetModal) === false) return

    // Get modal ID
    const modalId = typeof targetModal === 'string' ? targetModal : targetModal.id

    // clear events in case previous modal wasn't closed
    if (activeModals.has(modalId)) {
      activeModals.get(modalId).removeEventListeners()
    }

    // stores reference to active modal
    const modal = new Modal(options)
    activeModals.set(modalId, modal)
    modal.showModal()
  }

  /**
   * Closes the active modal
   * @param  {string|object} targetModal The id of the modal to close, or the modal element itself
   * @return {void}
   */
  const close = targetModal => {
    const modalId = typeof targetModal === 'string' ? targetModal : targetModal.id
    if (activeModals.has(modalId)) {
      activeModals.get(modalId).closeModal()
      activeModals.delete(modalId)
    }
  }

  return { init, show, close }
})()

// export default MicroModal

if (typeof window !== 'undefined') {
  window.MicroModal = MicroModal
}

document.addEventListener('DOMContentLoaded', function() {
  // FRE-2532 — increments on every insertContent so popups that share a visible
  // title still get unique aria-labelledby ids.
  let popupOpenCount = 0;

  const createModalTemplate = (modalId) => `
    <div class="modal micromodal-slide" id="${modalId}" aria-hidden="true">
      <div class="modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
          <header class="modal__header" aria-labelledby="${modalId}-title">
            <h1 class="modal__title" id="${modalId}-title"></h1>
            <button class="modal__close" aria-label="Close modal" data-micromodal-close>
              <i class="xCross"></i>
            </button>
          </header>
          <div class="modal__content" id="${modalId}-content"></div>
        </div>
        <div class="loading-dots" style="display: flex;">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div></>
      </div>
    </div>
  `;

  // Sequentially load one entry from the include-highchart list (a self-hosted script URL).
  // Returns a Promise that resolves once the script has finished loading.
  const loadHighchartEntry = (entry, existingScriptBases) => {
    const src = entry.split('?')[0];
    const isBaseHighcharts = /(^|\/)highcharts(\.js)?$/i.test(src);
    if (existingScriptBases.includes(src)) return Promise.resolve();
    if (isBaseHighcharts && window.Highcharts) return Promise.resolve();

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = entry;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  };

  const ensureHighchartScripts = ($temp) => {
    const include_highchart = $temp.find('#include-highchart');
    if (!include_highchart.length) return Promise.resolve();

    const list = (include_highchart.attr('list') || '').split(',').map(s => s.trim()).filter(Boolean);
    const existingScriptBases = Array.from(document.querySelectorAll('script[src]'))
      .map(s => (s.getAttribute('src') || '').split('?')[0]);
    include_highchart.remove();

    // Load sequentially so modules (highcharts-more, accessibility, theme) don't evaluate before
    // Highcharts core defines window.Highcharts.
    return list.reduce((p, entry) => p.then(() => loadHighchartEntry(entry, existingScriptBases)), Promise.resolve());
  };

  const insertContent = (modalId, html, isImage = false) => {
    const modalContent = document.getElementById(`${modalId}-content`);
    const modalContainer = document.querySelector(`#${modalId} .modal__container`);
    const loadingDots = document.querySelector(`#${modalId} .loading-dots`);

    const temp = document.createElement('div');
    temp.innerHTML = html;
    const $temp = $(temp);

    // Gate inline-script-bearing modal content on Highcharts being fully loaded. Without this,
    // jQuery's append below would synchronously execute inline `new Highcharts.Chart(...)` blocks
    // before the async <script> loads complete, throwing "Highcharts is not defined".
    ensureHighchartScripts($temp).then(() => {
      const headerTitle = temp.querySelector('.header h4');
      if (headerTitle) {
        // Look up the title element by class, not by id. The id is rewritten on each
        // open to keep aria-labelledby unique, so a subsequent getElementById against
        // the original id would miss the element and leave the previous popup's title.
        const modalTitle = document.querySelector(`#${modalId} .modal__title`);
        if (modalTitle) {
          modalTitle.innerHTML = headerTitle.innerHTML;
          temp.querySelector('.header').remove();

          // FRE-2532 — derive a unique aria-labelledby id from the popup's title plus
          // an incrementing counter so two popups that share a visible title (e.g.
          // multiple "Edit" popups on admin/enrollment) still get distinct ids.
          const titleText = (modalTitle.textContent || '').trim();
          if (titleText) {
            const slug = titleText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'modal';
            popupOpenCount += 1;
            const uniqueId = `${modalId}-${slug}-${popupOpenCount}-title`;
            const previousId = modalTitle.id;
            modalTitle.id = uniqueId;
            const modalRoot = document.getElementById(modalId);
            modalRoot.querySelectorAll(`[aria-labelledby="${previousId}"]`).forEach(el => {
              el.setAttribute('aria-labelledby', uniqueId);
            });
          }
        }
      }

      const content = temp.querySelector('.facebox-content');
      if (content) {
        const newClasses = Array.from(content.classList)
          .filter(className => className !== 'facebox-content')
          .join(' ');
        modalContainer.className = `modal__container ${newClasses}`;
      }

      modalContent.innerHTML = '';
      $(modalContent).append($(temp).contents());

      if (isImage) {
        modalContainer.classList.add('image__modal');
      } else {
        modalContainer.classList.remove('image__modal');
      }

      loadingDots.style.display = 'none';
      modalContainer.style.display = 'block';

      $(document).trigger('reveal.facebox').trigger('afterReveal.facebox');
    });
  };

  // Direct image URLs must render as <img>. Fetching them as XHR text inserts raw bytes (FRE-1894).
  // Match path only (strip ?query / #fragment); keep in sync with Excalibur.facebox image detection.
  const faceboxAjaxUrlIsDirectImage = (url) => {
    if (!url || typeof url !== 'string') return false
    const path = url.split(/[?#]/)[0]
    return /\.(gif|jpe?g|png|webp|bmp|svg|ico|avif)$/i.test(path)
  }

  const faceboxImageModalHtml = (url) => {
    const safe = String(url)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<img src="${safe}" alt="">`
  }

  const handleModalContent = (modalId, obj) => {
    let modal = document.getElementById(modalId);
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', createModalTemplate(modalId));
      modal = document.getElementById(modalId);
    }

    const modalContainer = modal.querySelector('.modal__container');
    const loadingDots = modal.querySelector('.loading-dots');

    if (!modalContainer || !loadingDots) {
      console.error(`Modal elements not found for modal ID: ${modalId}`);
      return;
    }

    loadingDots.style.display = 'flex';
    modalContainer.style.display = 'none';

    MicroModal.show(modalId);

    if (!obj) return;

    if (typeof obj === 'string') {
      insertContent(modalId, obj);
      return;
    }

    if (typeof obj === 'object') {
      if (obj.ajax) {
        const rawUrl = obj.ajax
        if (faceboxAjaxUrlIsDirectImage(rawUrl)) {
          insertContent(modalId, faceboxImageModalHtml(rawUrl), true)
          return
        }
        // Ensure server treats this as XHR and returns router-friendly markup
        let url = rawUrl;
        const hasQuery = url.indexOf('?') > -1;
        url = url + (hasQuery ? '&' : '?') + 'router=true';
        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }})
          .then(response => response.text())
          .then(html => {
            insertContent(modalId, html);
          })
          .catch(error => {
            console.error('Error loading modal content:', error);
          });
        return;
      }

    if (obj.image) {
      insertContent(modalId, faceboxImageModalHtml(obj.image), true);
      return;
    }

      if (obj.div) {
        const element = document.querySelector(obj.div);
        if (element) {
          insertContent(modalId, element.innerHTML);
        }
        return;
      }
    }
  };

  if (!document.getElementById('modal-1')) {
    document.body.insertAdjacentHTML('beforeend', createModalTemplate('modal-1'));
  }

  if (!document.getElementById('modal-2')) {
    document.body.insertAdjacentHTML('beforeend', createModalTemplate('modal-2'));
  }

  MicroModal.init({
    disableScroll: true,
    awaitCloseAnimation: true,
    onShow: modal => {},
    onClose: modal => {}
  });

  $.facebox = function(obj) {
    handleModalContent('modal-1', obj);
  };

  $.facebox.open = function(obj, callback) {
    let modal = document.getElementById('modal-2');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', createModalTemplate('modal-2'));
      modal = document.getElementById('modal-2');
    }
    
    const modalContainer = modal.querySelector('.modal__container');
    if (typeof callback === 'function' && modalContainer) {
      modalContainer.dataset.closeCallback = callback.toString();
    }
    handleModalContent('modal-2', obj);
  };

  $.facebox.close = function() {
    const openModals = Array.from(document.querySelectorAll('.modal.is-open'));
    if (openModals.length > 0) {
      const lastModal = openModals[openModals.length - 1];
      const modalContainer = lastModal.querySelector('.modal__container');
      
      if (modalContainer && modalContainer.dataset.closeCallback) {
        const callback = new Function('return ' + modalContainer.dataset.closeCallback)();
        callback();
        delete modalContainer.dataset.closeCallback;
      }
      
      const id = lastModal.id;
      MicroModal.close(id);
    }
  };

  window.closeTheFacebox = function() {
    $.facebox.close();
  };

  $('a[rel*=facebox]:not([excalibur-click])').each(function() {
    $(this).attr('excalibur-click', 'Excalibur.facebox');
  });

  // jQuery plugin for backward compatibility (e.g. functions-main-site.js).
  // Must not use { ajax: href } for image URLs — same issue as FRE-1894.
  $.fn.facebox = function() {
    return this.each(function() {
      $(this).on('click', function(e) {
        e.preventDefault();
        var href = $(this).attr('href');
        if (href) {
          if (faceboxAjaxUrlIsDirectImage(href)) {
            handleModalContent('modal-1', { image: href });
          } else {
            handleModalContent('modal-1', { ajax: href });
          }
        }
        return false;
      });
    });
  };
});
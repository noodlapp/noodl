const KeyboardHandler = require('@noodl-utils/keyboardhandler').default;
const { KeyCode } = require('@noodl-utils/keyboard/KeyCode');
const View = require('../../../shared/view');
const PopupLayerTemplate = require('../templates/popuplayer.html');
const StringInputPopupTemplate = require('../templates/stringinputpopup.html');
const YesNoPopupTemplate = require('../templates/yesnopopup.html');
const FileSystem = require('../utils/filesystem');
const ConfirmModal = require('./confirmmodal');
const ErrorModal = require('./errormodal');
const { ToastLayer } = require('./ToastLayer/ToastLayer');

const utils = require('../utils/utils');
const { platform, PlatformOS } = require('@noodl/platform');

// Styles
require('../styles/popuplayer.css');

// ---------------------------------------------------------------------
// PopupLayer
// ---------------------------------------------------------------------
function PopupLayer() {
  View.call(this);

  this.isShowingPopup = false;
  this.ignoreContextMenuEvent = false;

  this.isLocked = false; //locked means that a body click event won't close the popup
  this.contentId = '';
  this.popouts = [];
  this._dimLayerCount = 0;
  this.modals = [];

  KeyboardHandler.instance.registerCommands([
    {
      handler: () => {
        if (this.popup && this.isShowingPopup) {
          this.hidePopup();
        } else if (this.modals.length) {
          this.hideModal();
        } else if (this.popouts.length) {
          this.hidePopouts();
        }
      },
      keybinding: KeyCode.Escape
    }
  ]);
}

PopupLayer.prototype = Object.create(View.prototype);

PopupLayer.prototype.resize = function () {
  this.width = $(window).width();
  this.height = $(window).height();
};

PopupLayer.prototype.render = function () {
  var _this = this;

  var el = this.bindView($(PopupLayerTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  this.resize();
  $(window).on('resize', () => this.resize());

  // Detect if you click outside of a popup, then it should be closed
  var shouldClosePopup = false;
  $('body')
    .on('click', function (e) {
      if (!$(e.target).parents().is(_this.$('.popup-layer-popup')) && shouldClosePopup && !_this.modals.length) {
        _this.hidePopup();
        _this.hideTooltip();
      }
    })
    .on('mousedown', function (e) {
      shouldClosePopup = !$(e.target).parents().is(_this.$('.popup-layer-popup')) && !_this.isLocked;
    });

  // Detect if you click outside of a popout and popup, then all popouts should be closed
  var shouldClosePopout = false;

  function onClick(e) {
    if (
      !(
        $(e.target).parents().is(_this.$('.popup-layer-popup')) ||
        $(e.target).parents().is(_this.$('.popup-layer-popouts'))
      ) &&
      shouldClosePopout &&
      !_this.modals.length
    ) {
      _this.hidePopouts();
    }
  }

  $('body')
    .on('click', onClick)
    .on('contextmenu', (e) => {
      if (!this.ignoreContextMenuEvent) {
        onClick(e);
      }
    })
    .on('mousedown', (e) => {
      shouldClosePopout =
        !(
          $(e.target).parents().is(this.$('.popup-layer-popup')) ||
          $(e.target).parents().is(this.$('.popup-layer-popouts'))
        ) && !this.isLocked;

      //On Windows contextmenu is sent after mousedown. This can cause popups that are opened through mousedown to close immediately.
      //So ignore the contextmenu event for 0.1 seconds to remedy this
      if (platform.os === PlatformOS.Windows) {
        this.ignoreContextMenuEvent = true;
        setTimeout(() => {
          this.ignoreContextMenuEvent = false;
        }, 100);
      }
    });

  // Check if should close modal
  _this.shouldCloseModal = false;
  _this.allowShouldCloseModal = false;

  $('body')
    .on('click', () => {
      if (_this.shouldCloseModal) {
        _this.hideModal();
        _this.shouldCloseModal = false;
        _this.allowShouldCloseModal = false;
      }
    })
    .on('mousedown', (e) => {
      if (_this.allowShouldCloseModal) {
        _this.shouldCloseModal = !$(e.target).parents().is(_this.$('.popup-layer-modal'));
      }
    });

  // Drop files on body to copy to project folder
  var isValid = function (dataTransfer) {
    return dataTransfer !== undefined && dataTransfer.types && dataTransfer.types.indexOf('Files') >= 0;
  };

  const { ProjectModel } = require('../models/projectmodel'); //include here to fix circular dependency

  $('body')[0].addEventListener('dragover', function (evt) {
    // Indicate drop is OK
    if (ProjectModel.instance && isValid(evt.dataTransfer)) {
      _this.showFileDrop();

      evt.dataTransfer.dropEffect = 'copy';
    }

    evt.stopPropagation();
    evt.preventDefault();
  });

  $('body')[0].addEventListener('dragleave', function (evt) {
    _this.hideFileDrop();

    evt.stopPropagation();
    evt.preventDefault();
  });

  $('body')[0].addEventListener('drop', function (evt) {
    if (ProjectModel.instance && isValid(evt.dataTransfer)) {
      var files = evt.dataTransfer.files;

      var _files = [];
      function collectFiles(file, basedir) {
        if (FileSystem.instance.isPathDirectory(file.fullPath)) {
          var subfiles = FileSystem.instance.readDirectorySync(file.fullPath);
          subfiles.forEach((f) => {
            collectFiles({ fullPath: f.fullPath, name: f.fullPath.substring(basedir.length + 1) });
          });
        } else _files.push(file);
      }

      const toastActivityId = 'toast-drop-files-progress-id';
      try {
        for (var i = 0; i < files.length; i++) {
          collectFiles(
            { fullPath: files[i].path, name: files[i].name },
            FileSystem.instance.getFileDirectoryName(files[i].path)
          );
        }

        _files.forEach((f, index) => {
          ProjectModel.instance.copyFileToProjectDirectory(f);

          const progress = index / _files.length;
          ToastLayer.showProgress('Copying files to project folder.', progress, toastActivityId);
        });

        if (_files.length === 1) {
          ToastLayer.showSuccess('Successfully copied file to the project folder.');
        } else {
          ToastLayer.showSuccess(`Successfully copied ${_files.length} files to the project folder.`);
        }
      } catch (e) {
        console.error(e);
        ToastLayer.showError(
          'Failed to drop file. This is most likely caused by a temporary file, place the file in a normal folder and try again.'
        );
      } finally {
        ToastLayer.hideActivity(toastActivityId);
      }
    }

    _this.hideFileDrop();

    evt.stopPropagation();
    evt.preventDefault();
  });

  View.showTooltip = this.showTooltip.bind(this);
  View.hideTooltip = this.hideTooltip.bind(this);

  return this.el;
};

PopupLayer.prototype.getContentId = function () {
  return this.contentId;
};

PopupLayer.prototype._dimBakckground = function () {
  this._dimLayerCount++;
  this.$('.popup-layer').addClass('dim');
};

PopupLayer.prototype._undimBackground = function () {
  this._dimLayerCount--;

  if (this._dimLayerCount <= 0) {
    this.$('.popup-layer').removeClass('dim');
    this._dimLayerCount = 0;
  }
};

// Popups
PopupLayer.prototype.hidePopup = function (args) {
  if (this.popup && this.isShowingPopup) {
    this._undimBackground();
    this.popup && this.popup.content.el.detach();
    this.$('.popup-layer-popup').css({ visibility: 'hidden' });
    this.popup.onClose && this.popup.onClose();
    this.popup.content.onClose && this.popup.content.onClose();
    this.isShowingPopup = false;
    this.contentId = '';
    this._disablePopupAutoheight();
  }
  this.$('.popup-layer-blocker').css({ display: 'none' });
};

PopupLayer.prototype._enablePopupAutoheight = function () {
  this.$('.popup-layer-popup').css({ height: 'auto' });
  this.$('.popup-layer-popup-content').css({ position: 'relative' });
  this.$('.popup-layer-popup-content > *').css({ display: 'inline-block', verticalAlign: 'bottom' });
};

PopupLayer.prototype._disablePopupAutoheight = function () {
  this.$('.popup-layer-popup').css({ height: '' });
  this.$('.popup-layer-popup-content').css({ position: '' });
  this.$('.popup-layer-popup-content > *').css({ display: '', verticalAlign: '' });
};

PopupLayer.prototype.setContentSize = function (contentWidth, contentHeight) {
  this.$('.popup-layer-popup').css({
    width: contentWidth,
    height: contentHeight,
    transition: 'none'
  });
};

// Popup
PopupLayer.prototype.showPopup = function (args) {
  var arrowSize = 10;

  this.hidePopup();
  this.$('.popup-layer-blocker').css({ display: '' });

  var content = args.content.el;
  args.content.owner = this;

  this.$('.popup-layer-popup-content').append(content);
  var contentWidth = content.outerWidth(true);
  var contentHeight = content.outerHeight(true);

  if (args.position === 'screen-center') {
    if (args.isBackgroundDimmed) {
      this._dimBakckground();

      this.$('.popup-layer-popup').css({
        transition: '',
        transform: 'translateY(20px)',
        opacity: 0
      });

      setTimeout(() => {
        this.$('.popup-layer-popup').css({
          transition: 'all 200ms ease',
          transform: 'translateY(0)',
          opacity: 1
        });
      }, 100);
    }

    var x = this.width / 2 - contentWidth / 2,
      y = this.height / 2 - contentHeight / 2;

    this.$('.popup-layer-popup').css({
      position: 'absolute',
      left: x,
      top: y,
      width: contentWidth,
      height: contentHeight
    });
    this.$('.popup-layer-popup-arrow').css({ display: 'none' });
    this.$('.popup-layer-popup').css({ visibility: 'visible' });
  } else {
    var attachToLeft = args.attachTo ? args.attachTo.offset().left : args.attachToPoint.x;
    var attachToTop = args.attachTo ? args.attachTo.offset().top : args.attachToPoint.y;
    var attachToWidth = args.attachTo ? args.attachTo.outerWidth(true) : 0;
    var attachToHeight = args.attachTo ? args.attachTo.outerHeight(true) : 0;

    // Figure out the position of the popup
    var x, y;
    this.$('.popup-layer-popup-arrow')
      .removeClass('left')
      .removeClass('right')
      .removeClass('bottom')
      .removeClass('top');
    if (args.position === 'bottom') {
      x = attachToLeft + attachToWidth / 2 - contentWidth / 2;
      y = attachToHeight + attachToTop + arrowSize;
      this.$('.popup-layer-popup-arrow').addClass('top');
    } else if (args.position === 'top') {
      x = attachToLeft + attachToWidth / 2 - contentWidth / 2;
      y = attachToTop - contentHeight - arrowSize;
      this.$('.popup-layer-popup-arrow').addClass('bottom');
    } else if (args.position === 'left') {
      x = attachToLeft - contentWidth - arrowSize;
      y = attachToTop + attachToHeight / 2 - contentHeight / 2;
      this.$('.popup-layer-popup-arrow').addClass('right');
    } else if (args.position === 'right') {
      x = attachToWidth + attachToLeft + arrowSize;
      y = attachToTop + attachToHeight / 2 - contentHeight / 2;
      this.$('.popup-layer-popup-arrow').addClass('left');
    }

    // Make sure the popup is not outside of the screen
    var margin = 2;
    if (x + contentWidth > this.width - margin) x = this.width - margin - contentWidth;
    if (y + contentHeight > this.height - margin) y = this.height - margin - contentHeight;
    if (x < margin) x = margin;
    if (y < margin) y = margin;

    // Cannot cover to bar as that is used for moving window
    const topBarHeight = utils.windowTitleBarHeight();

    if (y < topBarHeight) y = topBarHeight;

    // Position the popup
    this.$('.popup-layer-popup').css({
      position: 'absolute',
      left: x,
      top: y,
      transition: 'none'
    });

    this.setContentSize(contentWidth, contentHeight);

    // Set the position of the arrow
    this.$('.popup-layer-popup-arrow').css({
      left:
        args.position === 'top' || args.position === 'bottom'
          ? Math.round(Math.abs(attachToLeft + attachToWidth / 2 - x)) + 'px'
          : '',
      top:
        args.position === 'left' || args.position === 'right'
          ? Math.round(Math.abs(attachToTop + attachToHeight / 2 - y)) + 'px'
          : ''
    });

    this.$('.popup-layer-popup-arrow').css({ display: 'initial' });
    this.$('.popup-layer-popup').css({ visibility: 'visible' });
  }

  if (args.hasDynamicHeight) {
    this._enablePopupAutoheight();
  }

  this.popup = args;
  this.popup.onOpen && this.popup.onOpen();
  this.popup.content.onOpen && this.popup.content.onOpen();
  this.isShowingPopup = true;
  this.contentId = args.contentId;
};

PopupLayer.prototype._resizePopout = function (popout, args) {
  const popoutEl = popout.el;
  const content = popoutEl.find('.popup-layer-popout-content');

  const contentWidth = content.outerWidth(true);
  const contentHeight = content.outerHeight(true);

  popoutEl.css({
    width: contentWidth,
    height: contentHeight,
    transition: 'none'
  });
};

PopupLayer.prototype._positionPopout = function (popout, args) {
  const popoutEl = popout.el;
  const position = popout.position;
  const attachRect = popout.attachToRect;

  const content = popoutEl.find('.popup-layer-popout-content');

  const arrowSize = 10;

  const contentWidth = content.outerWidth(true);
  const contentHeight = content.outerHeight(true);

  // Figure out the position of the popup
  let x, y;

  if (!args.disableCentering)
    popoutEl
      .find('.popup-layer-popout-arrow')
      .removeClass('left')
      .removeClass('right')
      .removeClass('bottom')
      .removeClass('top');
  if (position === 'bottom') {
    x = attachRect.left + attachRect.width / 2 - contentWidth / 2;
    y = attachRect.height + attachRect.top + arrowSize;
    popoutEl.find('.popup-layer-popout-arrow').addClass('top');
  } else if (position === 'top') {
    x = attachRect.left + attachRect.width / 2 - contentWidth / 2;
    y = attachRect.top - contentHeight - arrowSize;
    popoutEl.find('.popup-layer-popout-arrow').addClass('bottom');
  } else if (position === 'left') {
    x = attachRect.left - contentWidth - arrowSize;
    y = attachRect.top + attachRect.height / 2 - contentHeight / 2;
    popoutEl.find('.popup-layer-popout-arrow').addClass('right');
  } else if (position === 'right') {
    x = attachRect.width + attachRect.left + arrowSize;
    y = attachRect.top + attachRect.height / 2 - contentHeight / 2;
    popoutEl.find('.popup-layer-popout-arrow').addClass('left');
  }

  // Make sure the popup is not outside of the screen
  const margin = 10;
  if (args.offsetX) x += args.offsetX;
  if (args.offsetY) y += args.offsetY;

  if (x + contentWidth > this.width - margin) x = this.width - margin - contentWidth;
  if (y + contentHeight > this.height - margin) y = this.height - margin - contentHeight;
  if (x < margin) x = margin;
  if (y < margin) y = margin;

  // Cannot cover to bar as that is used for moving window
  const topBarHeight = utils.windowTitleBarHeight();

  if (y < topBarHeight) y = topBarHeight;

  // Position the popup
  popoutEl.css({
    position: 'absolute',
    left: x,
    top: y,
    transition: 'none'
  });

  // Set the position of the arrow
  popoutEl.find('.popup-layer-popout-arrow').css({
    left:
      position === 'top' || position === 'bottom'
        ? Math.round(Math.abs(attachRect.left + attachRect.width / 2 - x)) + 'px'
        : '',
    top:
      position === 'left' || position === 'right'
        ? Math.round(Math.abs(attachRect.top + attachRect.height / 2 - y)) + 'px'
        : ''
  });
};

// Popout
PopupLayer.prototype.showPopout = function (args) {
  this.$('.popup-layer-blocker').css({ display: '' });

  var content = args.content.el;
  args.content.owner = this;

  var popoutEl = this.cloneTemplate('popout');
  this.$('.popup-layer-popouts').append(popoutEl);

  popoutEl.find('.popup-layer-popout-content').append(content);
  popoutEl.find('.popup-layer-popout').css({ visibility: 'visible' });

  const resizeObserver = new ResizeObserver((entries) => {
    this._resizePopout(popout, args);
    if (!args.disableDynamicPositioning) {
      this._positionPopout(popout, args);
    }
  });

  //note: the dom element in attachTo can become invalid while the popout is open (when the property panel re-renders)
  //so we need to save the position now and hope the attach point doesn't move
  const popout = {
    el: popoutEl,
    onClose: args.onClose,
    position: args.position,
    animate: args.animate,
    manualClose: args.manualClose,
    attachToRect: {
      left: args.attachTo ? args.attachTo.offset().left : args.attachToPoint.x,
      top: args.attachTo ? args.attachTo.offset().top : args.attachToPoint.y,
      width: args.attachTo ? args.attachTo.outerWidth(true) : 0,
      height: args.attachTo ? args.attachTo.outerHeight(true) : 0
    },
    resizeObserver
  };
  this.setPopoutArrowColor(popout, args.arrowColor || '313131');

  this._resizePopout(popout, args);
  this._positionPopout(popout, args);
  resizeObserver.observe(content[0]);

  this.popouts.push(popout);

  if (args.animate) {
    popoutEl.css({
      transform: 'translateY(10px)',
      opacity: 0
    });

    setTimeout(() => {
      popoutEl.css({ transition: 'all 200ms ease-out', transform: 'translateY(0px)', opacity: 1 });
    }, 50);
  }

  return popout;
};

PopupLayer.prototype.setPopoutArrowColor = function (popout, color) {
  // Set the position of the arrow
  const _arrowColorCssAttr = {
    bottom: 'borderBottomColor',
    top: 'borderTopColor',
    left: 'borderLeftColor',
    right: 'borderRightColor'
  };
  const arrowColorCss = {};
  arrowColorCss[_arrowColorCssAttr[popout.position]] = color;
  popout.el.find('.popup-layer-popout-arrow').css(arrowColorCss);
};

PopupLayer.prototype.hidePopouts = function (manual) {
  const popouts = [...this.popouts]; //shallow copy since we'll modify the array in the loop
  popouts.forEach((p) => {
    if (!p.manualClose || manual === true) {
      this.hidePopout(p);
    }
  });
};

PopupLayer.prototype.hidePopout = function (popout) {
  if (!popout) return;

  const i = this.popouts.indexOf(popout);
  if (i !== -1) {
    this.popouts.splice(i, 1);
  }

  popout.resizeObserver.disconnect();
  popout.onClose && popout.onClose();

  const close = () => {
    popout.el.detach();

    if (this.popouts.length === 0) {
      this.$('.popup-layer-blocker').css({ display: 'none' });
    }
  };

  if (popout.animate) {
    popout.el.css({ transition: 'all 200ms ease-out', transform: 'translateY(10px)', opacity: 0 });
    setTimeout(() => {
      close();
    }, 250);
  } else {
    close();
  }
};

// Modals
PopupLayer.prototype.showModal = function (args) {
  const content = args.content.el;
  args.content.owner = this;

  this.$('.popup-layer-modal-content').html(content);

  //If the previous popup is being hidden, cancel that timer
  this._hideTimeoutId && clearTimeout(this._hideTimeoutId);

  // Position the popup
  this.$('.popup-layer-modal').css({
    transform: 'translate(-50%, calc(-50% + -20px))',
    transition: 'none',
    opacity: 0
  });
  this.$('.popup-layer-modal').css({ visibility: 'visible' });

  this._dimBakckground();

  setTimeout(() => {
    this.$('.popup-layer-modal').css({ transition: 'all 200ms ease', transform: 'translate(-50%, -50%)', opacity: 1 });
  }, 100);

  const modal = args;

  modal.onOpen && modal.onOpen();
  modal.content.onOpen && modal.content.onOpen();
  this.modals.push(modal);

  return modal;
};

PopupLayer.prototype.hideModal = function (modal) {
  if (!modal) {
    modal = this.modals.pop();
  } else {
    const index = this.modals.indexOf(modal);
    if (index !== -1) {
      this.modals.splice(index, 1);
    }
  }

  if (modal) {
    this.$('.popup-layer-modal').css({ transform: 'translate(-50%, calc(-50% + -20px))', opacity: 0 });
    this._undimBackground();
    this._hideTimeoutId = setTimeout(() => {
      this.$('.popup-layer-modal').css({ visibility: 'hidden' });
      this.$('.popup-layer-modal-content').empty();
    }, 200);
    modal.onClose && modal.onClose();
  }
};

PopupLayer.prototype.hideAllModalsAndPopups = function () {
  const modals = this.modals.slice();
  modals.forEach((modal) => this.hideModal(modal));

  this.hidePopup();
  this.hidePopouts();
  this.hideTooltip();
};

PopupLayer.prototype.showConfirmModal = function ({ message, title, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  var popup = new ConfirmModal({
    message: message,
    title: title,
    confirmLabel: confirmLabel,
    cancelLabel: cancelLabel,
    onCancel: () => {
      this.hideModal();
      onCancel && onCancel();
    },
    onConfirm: () => {
      this.hideModal();
      onConfirm && onConfirm();
    }
  });

  popup.render();

  this.showModal({
    content: popup,
    onClose: function () {},
    onOpen: function () {}
  });
};

PopupLayer.prototype.showErrorModal = function ({ message, title, onOk }) {
  //print error so it is logged to the debug log
  console.log('Showing error modal: ');
  console.log(` Title: ${title} Message:  ${message}`);

  var popup = new ErrorModal({
    message: message,
    title: title,
    onOk: () => {
      this.hideModal();
      onOk && onOk();
    }
  });

  popup.render();

  this.showModal({
    content: popup,
    onClose: function () {},
    onOpen: function () {}
  });
};

// ------------------ Drag and drop ---------------------
PopupLayer.prototype.startDragging = function (item) {
  var _this = this;

  this.$('.popup-layer-dragger-label').text(item.label);

  this.dragItem = item;

  function placeDragItem(x, y) {
    _this
      .$('.popup-layer-dragger')
      .css({ opacity: '1', '-webkit-transition': 'none', transform: 'translate3d(' + x + 'px,' + y + 'px,0px)' });
  }

  $('body').on('mousemove', function (e) {
    placeDragItem(e.pageX, e.pageY);
    e.preventDefault();
  });
  $('body').on('mouseup', function (e) {
    _this.dragCompleted();

    $('body').off('mousemove').off('mouseup');
    e.preventDefault();
  });
};

PopupLayer.prototype.isDragging = function () {
  return !!this.dragItem;
};

PopupLayer.prototype.indicateDropType = function (type) {
  var dropTypeClasses = {
    move: 'fa-share',
    add: 'fa-plus'
  };
  for (var i in dropTypeClasses) {
    this.$('.popup-layer-drop-type-indicator').removeClass(dropTypeClasses[i]);
  }

  if (type) this.$('.popup-layer-drop-type-indicator').addClass(dropTypeClasses[type]);
};

PopupLayer.prototype.setDragMessage = function (message) {
  if (message && message !== '') {
    this.$('.popup-layer-drag-message-text').text(message);
    this.$('.popup-layer-drag-message').show();
  } else {
    this.$('.popup-layer-drag-message').hide();
  }
};

PopupLayer.prototype.dragCompleted = function () {
  this.$('.popup-layer-dragger').css({ opacity: '0' });
  this.dragItem = undefined;
};

PopupLayer.prototype._setTooltipPosition = function (args) {
  if (args.offset && args.offset.x) {
    this.$('.popup-layer-tooltip-arrow').css({ transform: `translateX(-${args.offset.x}px)` });
  } else {
    this.$('.popup-layer-tooltip-arrow').css({ transform: '' });
  }

  this.$('.popup-layer-tooltip').css({ left: args.x, top: args.y, opacity: 1 });

  // Set arrow position
  this.$('.popup-layer-tooltip-arrow')
    .removeClass('left')
    .removeClass('right')
    .removeClass('top')
    .removeClass('bottom')
    .addClass(args.position);
};

PopupLayer.prototype._getTooltipPosition = function (args) {
  var contentWidth = this.$('.popup-layer-tooltip').outerWidth();
  var contentHeight = this.$('.popup-layer-tooltip').outerHeight();

  var attachToLeft = args.attachTo ? args.attachTo.offset().left : args.x;
  var attachToTop = args.attachTo ? args.attachTo.offset().top : args.y;
  var attachToWidth = args.attachTo ? args.attachTo[0].getBoundingClientRect().width : 0;
  var attachToHeight = args.attachTo ? args.attachTo[0].getBoundingClientRect().height : 0;

  if (args.offset && args.offset.x) {
    attachToLeft += args.offset.x;
  }

  var x, y;
  var arrowSize = 5;
  if (args.position === undefined || args.position === 'bottom') {
    x = attachToLeft + attachToWidth / 2 - contentWidth / 2;
    y = attachToHeight + attachToTop + arrowSize;
  } else if (args.position === 'top') {
    x = attachToLeft + attachToWidth / 2 - contentWidth / 2;
    y = attachToTop - contentHeight - arrowSize;
  } else if (args.position === 'left') {
    x = attachToLeft - contentWidth - arrowSize;
    y = attachToTop + attachToHeight / 2 - contentHeight / 2;
  } else if (args.position === 'right') {
    x = attachToWidth + attachToLeft + arrowSize;
    y = attachToTop + attachToHeight / 2 - contentHeight / 2;
  }

  return { x, y, contentWidth, contentHeight };
};

// -------------------------------- Tooltip ----------------------------------
PopupLayer.prototype.showTooltip = function (args) {
  if (this.isDragging()) return; // Don't show tooltip if a drag is in progress

  // Set text
  this.$('.popup-layer-tooltip-content').html(args.content);

  args.position = args.position || 'bottom'; //default to bottom

  //calculate tooltip position
  let rect = this._getTooltipPosition(args);

  //if the tooltip is attached to the bottom of an element, and gets placed outside
  //the screen, change position to top
  if (args.position === 'bottom' && rect.y + rect.contentHeight > window.innerHeight) {
    args.position = 'top';
    rect = this._getTooltipPosition(args);
  }

  //make sure the tooltip isn't rendered outside the screen, and that there's
  //a small amount of margin to the edge
  rect.x = Math.max(16, rect.x);

  this._setTooltipPosition({
    offset: args.offset,
    position: args.position,
    x: rect.x,
    y: rect.y
  });

  return rect;
};

PopupLayer.prototype.hideTooltip = function () {
  this.$('.popup-layer-tooltip').css({ opacity: 0 });
};

// ------------------ Toast ---------------------
PopupLayer.prototype.showToast = function (text) {
  var _this = this;

  this.$('.popup-layer-toast').text(text);
  var x = (this.width - this.$('.popup-layer-toast').width()) / 2;
  var y = (this.height - this.$('.popup-layer-toast').height()) / 2;

  this.$('.popup-layer-toast').css({ opacity: '1', transform: 'translate3d(' + x + 'px,' + y + 'px,0px)' });

  clearTimeout(this.toastHideTimeout);
  this.toastHideTimeout = setTimeout(function () {
    _this.$('.popup-layer-toast').css({ opacity: '0' });
  }, 2000);

  console.error(
    'showToast is deprecated. Use ToastLayer.showSuccess(), ToastLayer.showError() or ToastLayer.showInteraction() instead.'
  );
};

// ------------------ Toast ---------------------
PopupLayer.prototype.showActivity = function (text) {
  var _this = this;

  this.$('.popup-layer-activity-text').html(text);
  var x = (this.width - this.$('.popup-layer-activity').width()) / 2;
  var y = (this.height - this.$('.popup-layer-activity').height()) / 2;

  this.$('.popup-layer-activity').css({ opacity: '1', transform: 'translate3d(' + x + 'px,' + y + 'px,0px)' });

  this.$('.popup-layer-activity-progress').hide();
  this.$('.popup-layer-activity-progress-bar').css({ width: '0%' });

  console.error('showActivity is deprecated. Use ToastLayer.showActivity() instead.');
};

PopupLayer.prototype.hideActivity = function () {
  this.$('.popup-layer-activity').css({ opacity: '0', pointerEvents: 'none' });

  console.error('hideActivity is deprecated. Use ToastLayer.hideActivity() instead.');
};

/**
 *
 * @param {number} progress 0 to 100
 */
PopupLayer.prototype.showActivityProgress = function (progress) {
  this.$('.popup-layer-activity-progress').show();
  this.$('.popup-layer-activity-progress-bar').css({ width: progress + '%' });

  console.error('showActivityProgress is deprecated. Use ToastLayer.showProgress() instead.');
};

// ------------------ Indicate drop on ---------------------
PopupLayer.prototype.showFileDrop = function () {
  this.$('.popup-file-drop').show();
};

PopupLayer.prototype.hideFileDrop = function () {
  this.$('.popup-file-drop').hide();
};

// ---------------------------------------------------------------------
// PopupLayer.StringInputPopup
// ---------------------------------------------------------------------
PopupLayer.StringInputPopup = function (args) {
  for (var i in args) this[i] = args[i];
};
PopupLayer.StringInputPopup.prototype = Object.create(View.prototype);

PopupLayer.StringInputPopup.prototype.render = function () {
  this.el = this.bindView($(StringInputPopupTemplate), this);

  this.$('.string-input-popup-input')
    .off('keypress')
    .on('keypress', (e) => {
      if (e.which == 13) {
        this.onOkClicked();
      }
    });

  return this.el;
};

PopupLayer.StringInputPopup.prototype.onOkClicked = function () {
  var val = this.$('.string-input-popup-input')
    .val()
    .split(',')
    .map((x) => x.trim())
    .join();

  this.owner.hidePopup();

  this.onOk && this.onOk(val);
};

PopupLayer.StringInputPopup.prototype.onCancelClicked = function () {
  this.onCancel && this.onCancel();
  this.owner.hidePopup();
};

PopupLayer.StringInputPopup.prototype.onOpen = function () {
  this.$('.string-input-popup-input').focus();
};

// ---------------------------------------------------------------------
// PopupLayer.YesNoPopup
// ---------------------------------------------------------------------
PopupLayer.YesNoPopup = function (args) {
  for (var i in args) this[i] = args[i];

  if (!this.yesLabel) this.yesLabel = 'Yes';
  if (!this.noLabel) this.noLabel = 'No';
};
PopupLayer.YesNoPopup.prototype = Object.create(View.prototype);

PopupLayer.YesNoPopup.prototype.render = function () {
  var _this = this;

  this.el = this.bindView($(YesNoPopupTemplate), this);

  return this.el;
};

PopupLayer.YesNoPopup.prototype.onYesClicked = function () {
  this.owner.hidePopup();

  this.onYes && this.onYes();
};

PopupLayer.YesNoPopup.prototype.onNoClicked = function () {
  this.owner.hidePopup();

  this.onNo && this.onNo();
};

module.exports = PopupLayer;

var _ = require('underscore'),
  View = require('../../../shared/view'),
  NewUpdatePopupTemplate = require('../templates/newupdatepopup.html');

// Styles
require('../styles/newupdatepopup.css');

var NewUpdatePopup = function (args) {
  View.call(this);

  this.title = args.title;
  this.message = args.message;
  this.onCancel = args.onCancel;
  this.onDownload = args.onDownload;
  this.cancelLabel = args.cancelLabel || 'Cancel';
  this.downloadLabel = args.downloadLabel || 'Download';
};

NewUpdatePopup.prototype = Object.create(View.prototype);

NewUpdatePopup.prototype.resize = function (layout) {
  this.el.css({
    position: 'absolute',
    left: layout.x + 'px',
    top: layout.y + 'px',
    width: layout.width + 'px',
    height: layout.height + 'px'
  });
};

NewUpdatePopup.prototype.render = function () {
  var _this = this;

  var el = this.bindView($(NewUpdatePopupTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  return this.el;
};

NewUpdatePopup.prototype.onCancelClicked = function (scope, el, evt) {
  this.onCancel && this.onCancel();
  evt.stopPropagation();
};

NewUpdatePopup.prototype.onDownloadClicked = function (scope, el, evt) {
  this.onDownload && this.onDownload();
  evt.stopPropagation();
};

module.exports = NewUpdatePopup;

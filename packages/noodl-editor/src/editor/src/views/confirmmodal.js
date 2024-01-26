var View = require('../../../shared/view'),
  ConfirmModalTemplate = require('../templates/confirmmodal.html');

function ConfirmModal(args) {
  View.call(this);

  this.title = args.title || 'Confirm';
  this.message = args.message;
  this.confirmLabel = args.confirmLabel || 'Confirm';
  this.cancelLabel = args.cancelLabel || 'Cancel';

  this.onConfirm = args.onConfirm;
  this.onCancel = args.onCancel;
}

ConfirmModal.prototype = Object.create(View.prototype);

ConfirmModal.prototype.render = function () {
  var el = this.bindView($(ConfirmModalTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  return this.el;
};

ConfirmModal.prototype.onConfirmClicked = function (scope, el, evt) {
  this.onConfirm && this.onConfirm();
  evt.stopPropagation();
};

ConfirmModal.prototype.onCancelClicked = function (scope, el, evt) {
  this.onCancel && this.onCancel();
  evt.stopPropagation();
};

module.exports = ConfirmModal;

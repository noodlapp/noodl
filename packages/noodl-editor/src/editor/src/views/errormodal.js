var View = require('../../../shared/view'),
  ErrorModalTemplate = require('../templates/errormodal.html');

function ErrorModal(args) {
  View.call(this);

  this.title = args.title || 'Error';
  this.message = args.message;

  this.onOk = args.onOk;
}

ErrorModal.prototype = Object.create(View.prototype);

ErrorModal.prototype.render = function () {
  var el = this.bindView($(ErrorModalTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  return this.el;
};

ErrorModal.prototype.onOkClicked = function (scope, el, evt) {
  this.onOk && this.onOk();
  evt.stopPropagation();
};

module.exports = ErrorModal;

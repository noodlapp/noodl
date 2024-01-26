import View from '../../../../../../shared/view';
import { Ports } from './Ports';

export class PopoutGroup extends View {
  popoutGroup: TSFixme;
  label: TSFixme;
  view: TSFixme;
  el: TSFixme;
  group: TSFixme;
  parent: TSFixme;

  constructor(args) {
    super();
    this.group = args.group;
    this.popoutGroup = args.popoutGroup;
    this.label = args.label;
    this.parent = args.parent;
  }
  render() {
    this.el = this.bindView(this.parent.cloneTemplate('popout-group'), this);

    return this.el;
  }
  onPopoutClicked(scope, el, evt) {
    this.view = new Ports({
      model: this.parent.model,
      popout: this.popoutGroup
    });

    this.view.render();
    this.view.el.css({ width: '300px', overflowY: 'auto' });

    this.parent.showPopout({
      content: this.view,
      attachTo: el,
      position: 'right',
      onClose: () => {
        this.view && this.view.dispose();
      }
    });

    evt.stopPropagation();
  }
  dispose() {
    this.view && this.view.dispose();
  }
}

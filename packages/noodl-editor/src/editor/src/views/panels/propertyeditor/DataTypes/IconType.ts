import React from 'react';
import ReactDOM from 'react-dom';

import { NodeLibrary } from '@noodl-models/nodelibrary';

import IconPicker from '../iconpicker';
import { TypeView } from '../TypeView';
import { getEditType } from '../utils';

function firstType(type) {
  return NodeLibrary.nameForPortType(type);
}

export class IconType extends TypeView {
  el: TSFixme;

  static fromPort(args) {
    const view = new IconType();

    const p = args.port;
    const parent = args.parent;

    view.port = p;
    view.displayName = p.displayName ? p.displayName : p.name;
    view.name = p.name;
    view.type = getEditType(p);
    view.group = p.group;
    view.value = parent.model.getParameter(p.name);
    view.parent = parent;
    view.isConnected = parent.model.isPortConnected(p.name, 'target');
    view.isDefault = parent.model.parameters[p.name] === undefined;

    return view;
  }
  render() {
    this.el = this.bindView(this.parent.cloneTemplate(firstType(this.type)), this);
    TypeView.prototype.render.call(this);

    if (this.value) {
      if (this.value.codeAsClass) {
        this.$('#iconThumbnail').attr('class', [this.value.class, this.value.code].join(' ')).text('');
      } else {
        this.$('#iconThumbnail').attr('class', this.value.class).text(this.value.code);
      }
    }

    IconPicker.LoadIconSets((iconsSets) => {
      // Just make sure all styles and fonts are loaded
    });

    // var iconPicker;
    /* this.$('input').on('focus', function (e) {
      e.stopPropagation();
    })
      .on('click', function (e) {
  
      })
      .on('keyup', function (e) {
      //  iconPicker && iconPicker.setFilter($(this).val());
      })*/
    return this.el;
  }
  onLaunchClicked(scope, el, evt) {
    // Show Icon picker
    const props = {
      value: this.value,
      onIconSelected: (icon) => {
        if (icon.codeAsClass) {
          this.$('#iconThumbnail').attr('class', [icon.class, icon.code].join(' ')).text('');
        } else {
          this.$('#iconThumbnail').attr('class', icon.class).text(icon.code);
        }

        this.parent.setParameter(scope.name, { class: icon.class, code: icon.code, codeAsClass: icon.codeAsClass });
        this.isDefault = false;
        this.parent.hidePopout();
      }
    };
    const div = document.createElement('div');
    ReactDOM.render(React.createElement(IconPicker, props), div);

    this.parent.showPopout({
      content: {
        el: $(div)
      },
      attachTo: el,
      position: 'right'
    });

    evt.stopPropagation(); // Most stop propagation here otherwise the popup will close
  }

  // @ts-expect-error
  resetToDefault(scope, el) {
    this.$('#iconThumbnail').attr('class', '').text('');
  }
}

/*PropertyEditor.IconType.prototype.onPropertyChanged = function (scope, el) {
  this.parent.setParameter(scope.name, el.val() === '' ? undefined : el.val());

  // Update current value and if it is default or not
  var current = this.getCurrentValue();
  el.val(current.value);
  this.isDefault = current.isDefault;

  el.blur();
}*/

import PointerListeners from '../../pointerlisteners';

function _shallowCompare(o1, o2) {
  for (var p in o1) {
    if (o1.hasOwnProperty(p)) {
      if (o1[p] !== o2[p]) {
        return false;
      }
    }
  }
  for (var p in o2) {
    if (o2.hasOwnProperty(p)) {
      if (o1[p] !== o2[p]) {
        return false;
      }
    }
  }
  return true;
}

const _styleSheets = {};

function updateStylesForClass(_class, props, _styleTemplate) {
  if (_styleSheets[_class]) {
    // Check if props have changed
    if (!_shallowCompare(props, _styleSheets[_class].props)) {
      _styleSheets[_class].style.innerHTML = _styleTemplate(_class, props);
      _styleSheets[_class].props = Object.assign({}, props);
    }
  } else {
    // Create a new style sheet if none exists
    var style = document.createElement('style');
    style.innerHTML = _styleTemplate(_class, props);
    document.head.appendChild(style);

    _styleSheets[_class] = { style, props: Object.assign({}, props) };
  }
}

function addInputCss(definition, inputs) {
  if (!definition.inputCss) {
    definition.inputCss = {};
  }

  if (!definition.defaultCss) {
    definition.defaultCss = {};
  }

  for (const name in inputs) {
    definition.inputCss[name] = inputs[name];
    if (inputs[name].hasOwnProperty('default') && inputs[name].applyDefault !== false) {
      definition.defaultCss[name] = inputs[name].default;
    }
  }
}

function mergeAttribute(definition, attribute, values) {
  if (!definition[attribute]) {
    definition[attribute] = {};
  }

  for (const name in values) {
    definition[attribute][name] = values[name];
  }
}

function addInputs(definition, values) {
  mergeAttribute(definition, 'inputs', values);
}

function addInputProps(definition, values) {
  mergeAttribute(definition, 'inputProps', values);
}

function addDynamicInputPorts(definition, condition, inputs) {
  if (!definition.dynamicports) {
    definition.dynamicports = [];
  }

  definition.dynamicports.push({ condition, inputs });
}

function addOutputProps(definition, values) {
  mergeAttribute(definition, 'outputProps', values);
}

function addControlEventsAndStates(definition) {
  addInputProps(definition, {
    blockTouch: {
      index: 450,
      displayName: 'Block Pointer Events',
      type: 'boolean'
    }
  });

  addOutputProps(definition, {
    // Focus
    focusState: {
      displayName: 'Focused',
      group: 'States',
      type: 'boolean',
      props: {
        onFocus() {
          this.outputPropValues.focusState = true;
          this.flagOutputDirty('focusState');
          this.hasOutput('onFocus') && this.sendSignalOnOutput('onFocus');
        },
        onBlur() {
          this.outputPropValues.focusState = false;
          this.flagOutputDirty('focusState');
          this.hasOutput('onBlur') && this.sendSignalOnOutput('onBlur');
        }
      }
    },
    onFocus: {
      displayName: 'Focused',
      group: 'Events',
      type: 'signal',
      props: {
        onFocus() {
          this.outputPropValues.focusState = true;
          this.flagOutputDirty('focusState');
          this.sendSignalOnOutput('onFocus');
        }
      }
    },
    onBlur: {
      displayName: 'Blurred',
      group: 'Events',
      type: 'signal',
      props: {
        onBlur() {
          this.outputPropValues.focusState = false;
          this.flagOutputDirty('focusState');
          this.sendSignalOnOutput('onBlur');
        }
      }
    },

    // Hover
    hoverState: {
      displayName: 'Hover',
      group: 'States',
      type: 'boolean',
      props: {
        onMouseOver() {
          this.outputPropValues.hoverState = true;
          this.flagOutputDirty('hoverState');
          this.hasOutput('hoverStart') && this.sendSignalOnOutput('hoverStart');
        },
        onMouseLeave() {
          this.outputPropValues.hoverState = false;
          this.flagOutputDirty('hoverState');
          this.hasOutput('hoverEnd') && this.sendSignalOnOutput('hoverEnd');
        }
      }
    },
    hoverStart: {
      displayName: 'Hover Start',
      group: 'Events',
      type: 'signal',
      props: {
        onMouseOver() {
          this.outputPropValues.hoverState = true;
          this.flagOutputDirty('hoverState');
          this.sendSignalOnOutput('hoverStart');
        }
      }
    },
    hoverEnd: {
      displayName: 'Hover End',
      group: 'Events',
      type: 'signal',
      props: {
        onMouseLeave() {
          this.outputPropValues.hoverState = false;
          this.flagOutputDirty('hoverState');
          this.sendSignalOnOutput('hoverEnd');
        }
      }
    },

    // Pressed
    pressedState: {
      displayName: 'Pressed',
      group: 'States',
      type: 'boolean',
      props: {
        onMouseDown() {
          this.outputPropValues.pressedState = true;
          this.flagOutputDirty('pressedState');
          this.hasOutput('pointerDown') && this.sendSignalOnOutput('pointerDown');
        },
        onTouchStart() {
          this.outputPropValues.pressedState = true;
          this.flagOutputDirty('pressedState');
          this.hasOutput('pointerDown') && this.sendSignalOnOutput('pointerDown');
        },
        onMouseUp() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this.hasOutput('pointerUp') && this.sendSignalOnOutput('pointerUp');
        },
        onTouchEnd() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this.hasOutput('pointerUp') && this.sendSignalOnOutput('pointerUp');
        },
        onTouchCancel() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this.hasOutput('pointerUp') && this.sendSignalOnOutput('pointerUp');
        }
      }
    },
    pointerDown: {
      displayName: 'Pointer Down',
      group: 'Events',
      type: 'signal',
      props: {
        onMouseDown() {
          this.outputPropValues.pressedState = true;
          this.flagOutputDirty('pressedState');
          this.sendSignalOnOutput('pointerDown');
        },
        onTouchStart() {
          this.outputPropValues.pressedState = true;
          this.flagOutputDirty('pressedState');
          this.sendSignalOnOutput('pointerDown');
        }
      }
    },
    pointerUp: {
      displayName: 'Pointer Up',
      group: 'Events',
      type: 'signal',
      props: {
        onMouseUp() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this.sendSignalOnOutput('pointerUp');
        },
        onTouchEnd() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this.sendSignalOnOutput('pointerUp');
        },
        onTouchCancel() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this.sendSignalOnOutput('pointerUp');
        }
      }
    }
  });
}

function controlEvents(props) {
  return Object.assign(
    {},
    {
      onFocus: props.onFocus,
      onBlur: props.onBlur
    },
    PointerListeners(props)
  );
}

export default {
  updateStylesForClass,
  addControlEventsAndStates,
  controlEvents
};

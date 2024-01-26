import PointerListeners from '../../pointerlisteners';

function _shallowCompare(o1, o2) {
  let p;
  for (p in o1) {
    if (o1.hasOwnProperty(p)) {
      if (o1[p] !== o2[p]) {
        return false;
      }
    }
  }
  for (p in o2) {
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
    const style = document.createElement('style');
    style.innerHTML = _styleTemplate(_class, props);
    document.head.appendChild(style);

    _styleSheets[_class] = { style, props: Object.assign({}, props) };
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

function addOutputProps(definition, values) {
  mergeAttribute(definition, 'outputProps', values);
}

function addOutputs(definition, values) {
  mergeAttribute(definition, 'outputs', values);
}

function addControlEventsAndStates(definition, args?) {
  args = args || {};

  definition.visualStates = [
    { name: 'neutral', label: 'Neutral' },
    { name: 'hover', label: 'Hover' },
    { name: 'pressed', label: 'Pressed' },
    { name: 'focused', label: 'Focused' },
    { name: 'disabled', label: 'Disabled' }
  ];

  if (args.checked) {
    definition.visualStates.splice(3, 0, { name: 'checked', label: 'Checked' });
  }

  addInputs(definition, {
    enabled: {
      type: 'boolean',
      displayName: 'Enabled',
      group: 'General',
      default: true,
      set: function (value) {
        value = !!value;
        const changed = value !== this._internal.enabled;
        this.props.enabled = this._internal.enabled = value;

        if (changed) {
          this._updateVisualState();
          this.forceUpdate();
          this.flagOutputDirty('enabled');
        }
      }
    }
  });

  addInputProps(definition, {
    blockTouch: {
      index: 450,
      displayName: 'Block Pointer Events',
      type: 'boolean',
      group: 'Pointer Events'
    }
  });

  definition.methods._updateVisualState = function () {
    const states = [];

    //make sure they are in the order they should be applied
    if (this._internal.enabled) {
      if (this.outputPropValues.hoverState) states.push('hover');
      if (this.outputPropValues.pressedState) states.push('pressed');
      if (this.outputPropValues.focusState) states.push('focused');
    }

    if (args.checked && this._internal.checked) states.push('checked');
    if (!this._internal.enabled) states.push('disabled');

    this.setVisualStates(states);
  };

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
          this._updateVisualState();
        },
        onBlur() {
          this.outputPropValues.focusState = false;
          this.flagOutputDirty('focusState');
          this._updateVisualState();
        }
      }
    },
    onFocus: {
      displayName: 'Focused',
      group: 'Focus Events',
      type: 'signal',
      props: {
        onFocus() {
          this.sendSignalOnOutput('onFocus');
        }
      }
    },
    onBlur: {
      displayName: 'Blurred',
      group: 'Focus Events',
      type: 'signal',
      props: {
        onBlur() {
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
          this._updateVisualState();
        },
        onMouseLeave() {
          this.outputPropValues.hoverState = false;
          this.flagOutputDirty('hoverState');
          this._updateVisualState();
        }
      }
    },
    hoverStart: {
      displayName: 'Hover Start',
      group: 'Pointer Events',
      type: 'signal',
      props: {
        onMouseOver() {
          this.sendSignalOnOutput('hoverStart');
        }
      }
    },
    hoverEnd: {
      displayName: 'Hover End',
      group: 'Pointer Events',
      type: 'signal',
      props: {
        onMouseLeave() {
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
          this._updateVisualState();
        },
        onTouchStart() {
          this.outputPropValues.pressedState = true;
          this.flagOutputDirty('pressedState');
          this._updateVisualState();
        },
        onMouseUp() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this._updateVisualState();
        },
        onTouchEnd() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this._updateVisualState();
        },
        onTouchCancel() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this._updateVisualState();
        },
        onMouseLeave() {
          this.outputPropValues.pressedState = false;
          this.flagOutputDirty('pressedState');
          this._updateVisualState();
        }
      }
    },
    pointerDown: {
      displayName: 'Pointer Down',
      group: 'Pointer Events',
      type: 'signal',
      props: {
        onMouseDown() {
          this.sendSignalOnOutput('pointerDown');
        },
        onTouchStart() {
          this.sendSignalOnOutput('pointerDown');
        }
      }
    },
    pointerUp: {
      displayName: 'Pointer Up',
      group: 'Pointer Events',
      type: 'signal',
      props: {
        onMouseUp() {
          this.sendSignalOnOutput('pointerUp');
        },
        onTouchEnd() {
          this.sendSignalOnOutput('pointerUp');
        },
        onTouchCancel() {
          this.sendSignalOnOutput('pointerUp');
        }
      }
    }
  });

  addOutputs(definition, {
    enabled: {
      type: 'boolean',
      displayName: 'Enabled',
      group: 'States',
      getter: function () {
        return this._internal.enabled;
      }
    }
  });

  const oldInit = definition.initialize;
  definition.initialize = function () {
    oldInit && oldInit.call(this);
    this.props.enabled = this._internal.enabled = true;
    this.outputPropValues.hoverState = this.outputPropValues.focusState = this.outputPropValues.pressedState = false;
  };
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

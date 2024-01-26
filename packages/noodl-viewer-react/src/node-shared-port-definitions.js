import { getAbsoluteUrl } from '@noodl/runtime/src/utils';

import FontLoader from './fontloader';
import { createTooltip } from './tooltips';

function addInputCss(definition, inputs) {
  if (!definition.inputCss) {
    definition.inputCss = {};
  }

  if (!definition.defaultCss) {
    definition.defaultCss = {};
  }

  for (const name in inputs) {
    definition.inputCss[name] = inputs[name];
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

export default {
  addInputProps,
  addInputs,
  addDynamicInputPorts,
  addInputCss,
  addSharedVisualInputs(definition) {
    addInputCss(definition, {
      opacity: {
        index: 200,
        group: 'Style',
        displayName: 'Opacity',
        type: 'number',
        default: 1,
        allowVisualStates: true
      },
      mixBlendMode: {
        index: 201,
        group: 'Style',
        displayName: 'Blend Mode',
        type: {
          name: 'enum',
          enums: [
            { label: 'Normal', value: 'normal' },
            { label: 'Multiply', value: 'multiply' },
            { label: 'Screen', value: 'screen' },
            { label: 'Overlay', value: 'overlay' },
            { label: 'Darken', value: 'darken' },
            { label: 'Lighten', value: 'lighten' },
            { label: 'Color Dodge', value: 'color-dodge' },
            { label: 'Color Burn', value: 'color-burn' },
            { label: 'Hard Light', value: 'hard-light' },
            { label: 'Soft Light', value: 'soft-light' },
            { label: 'Difference', value: 'difference' },
            { label: 'Exclusion', value: 'exclusion' },
            { label: 'Hue', value: 'hue' },
            { label: 'Saturation', value: 'saturation' },
            { label: 'Color', value: 'color' },
            { label: 'Luminosity', value: 'luminosity' }
          ]
        },
        default: 'normal',
        applyDefault: false,
        allowVisualStates: true
      }
    });

    addInputs(definition, {
      visible: {
        index: 210,
        displayName: 'Visible',
        group: 'Style',
        default: true,
        type: 'boolean',
        set(value) {
          if (value) {
            this.removeStyle(['visibility']);
          } else {
            this.setStyle({ visibility: 'hidden' });
          }
        }
      },
      zIndex: {
        index: 211,
        displayName: 'zIndex',
        group: 'Style',
        type: 'number',
        allowVisualStates: true,
        set(value) {
          if (value === undefined) {
            this.removeStyle(['zIndex']);
          } else {
            this.setStyle({ zIndex: Number(value) });
          }
        }
      }
    });
  },
  addMarginInputs(definition) {
    addInputCss(definition, {
      marginLeft: {
        index: 1,
        group: 'Margin and padding',
        displayName: 'Margin Left',
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: 'px',
          marginPaddingComp: 'margin-left'
        },
        allowVisualStates: true
      },
      marginRight: {
        index: 2,
        group: 'Margin and padding',
        displayName: 'Margin Right',
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: 'px',
          marginPaddingComp: 'margin-right'
        },
        allowVisualStates: true
      },
      marginTop: {
        index: 3,
        group: 'Margin and padding',
        displayName: 'Margin Top',
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: 'px',
          marginPaddingComp: 'margin-top'
        },
        allowVisualStates: true
      },
      marginBottom: {
        index: 4,
        group: 'Margin and padding',
        displayName: 'Margin Bottom',
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: 'px',
          marginPaddingComp: 'margin-bottom'
        },
        allowVisualStates: true
      }
    });
  },
  addPaddingInputs(definition, args) {
    args = args || {};
    const defaults = args.defaults ? args.defaults : {};

    const styleTag = args.styleTag;

    addInputCss(definition, {
      paddingLeft: {
        index: 64,
        group: 'Margin and padding',
        default: defaults.paddingLeft || 0,
        applyDefault: false,
        displayName: 'Pad Left',
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px',
          marginPaddingComp: 'padding-left'
        },
        allowVisualStates: true,
        styleTag
      },
      paddingRight: {
        index: 65,
        group: 'Margin and padding',
        default: defaults.paddingRight || 0,
        applyDefault: false,
        displayName: 'Pad Right',
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px',
          marginPaddingComp: 'padding-right'
        },
        allowVisualStates: true,
        styleTag
      },
      paddingTop: {
        index: 66,
        group: 'Margin and padding',
        displayName: 'Pad Top',
        default: defaults.paddingTop || 0,
        applyDefault: false,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px',
          marginPaddingComp: 'padding-top'
        },
        allowVisualStates: true,
        styleTag
      },
      paddingBottom: {
        index: 67,
        group: 'Margin and padding',
        displayName: 'Pad Bottom',
        default: defaults.paddingBottom || 0,
        applyDefault: false,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px',
          marginPaddingComp: 'padding-bottom'
        },
        allowVisualStates: true,
        styleTag
      }
    });
  },
  addTransformInputs(definition) {
    addInputs(definition, {
      transformX: {
        group: 'Placement',
        displayName: 'Pos X',
        default: 0,
        index: 300,
        allowVisualStates: true,
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: 'px'
        },
        set(value) {
          if (!this.transforms) this.transforms = {};
          this.transforms.x = value.value + value.unit;
          this.updateTransform();
        }
      },
      transformY: {
        group: 'Placement',
        displayName: 'Pos Y',
        default: 0,
        index: 301,
        allowVisualStates: true,
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: 'px'
        },
        set(value) {
          if (!this.transforms) this.transforms = {};
          this.transforms.y = value.value + value.unit;
          this.updateTransform();
        }
      },
      transformRotation: {
        index: 302,
        group: 'Placement',
        displayName: 'Rotation',
        default: 0,
        allowVisualStates: true,
        type: {
          name: 'number',
          units: ['deg'],
          defaultUnit: 'deg'
        },
        set(value) {
          if (!this.transforms) this.transforms = {};
          this.transforms.rotation = value.value + value.unit;
          this.updateTransform();
        }
      },
      transformScale: {
        index: 303,
        group: 'Placement',
        displayName: 'Scale',
        default: 1,
        allowVisualStates: true,
        type: {
          name: 'number'
        },
        set(value) {
          if (!this.transforms) this.transforms = {};
          this.transforms.scale = value;
          this.updateTransform();
        }
      },
      transformOriginX: {
        index: 304,
        group: 'Placement',
        displayName: 'Transform Origin X',
        allowVisualStates: true,
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: '%'
        },
        default: '50',
        set(value) {
          this.transformOriginX = value.value + value.unit;
          this.updateTransformOrigin();
        }
      },
      transformOriginY: {
        index: 305,
        group: 'Placement',
        displayName: 'Transform Origin Y',
        allowVisualStates: true,
        type: {
          name: 'number',
          units: ['px', '%'],
          defaultUnit: '%'
        },
        default: '50',
        set(value) {
          this.transformOriginY = value.value + value.unit;
          this.updateTransformOrigin();
        }
      }
    });

    if (!definition.methods) definition.methods = {};

    definition.methods.updateTransform = function () {
      let transform = '';

      const { x, y, rotation, scale } = this.transforms;

      if (x) transform += `translateX(${x}) `;
      if (y) transform += `translateY(${y}) `;
      if (rotation) transform += `rotate(${rotation}) `;
      if (scale !== undefined) transform += `scale(${scale},${scale})`;

      this.setStyle({ transform });
    };

    definition.methods.updateTransformOrigin = function () {
      const x = this.transformOriginX !== undefined ? this.transformOriginX : '50%';
      const y = this.transformOriginY !== undefined ? this.transformOriginY : '50%';

      this.setStyle({
        transformOrigin: `${x} ${y}`
      });
    };
  },
  addAlignInputs(definition) {
    const positions = [
      { label: 'In Layout', value: 'relative' },
      { label: 'Absolute', value: 'absolute' },
      { label: 'Sticky', value: 'sticky' },
      { label: 'Fixed', value: 'fixed' }
    ];

    addInputCss(definition, {
      position: {
        index: 11,
        displayName: 'Position',
        group: 'Layout',
        type: {
          name: 'enum',
          enums: positions
        },
        default: 'relative'
      }
    });

    addInputProps(definition, {
      alignX: {
        index: 5,
        group: 'Alignment',
        displayName: 'Align X',
        type: {
          name: 'enum',
          enums: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' }
          ],
          alignComp: 'horizontal'
        }
      },
      alignY: {
        index: 6,
        group: 'Alignment',
        displayName: 'Align Y',
        type: {
          name: 'enum',
          enums: [
            { label: 'Top', value: 'top' },
            { label: 'Center', value: 'center' },
            { label: 'Bottom', value: 'bottom' }
          ],
          alignComp: 'vertical'
        }
      }
    });

    addPositionAndAlignTooltips(definition);
  },
  addPointerEventOutputs(definition) {
    addInputs(definition, {
      pointerEventsMode: {
        index: 403,
        displayName: 'Pointer Events Mode',
        type: {
          name: 'enum',
          enums: [
            { label: 'Inherit', value: 'inherit' },
            { label: 'Explicit', value: 'explicit' }
          ]
        },
        default: 'inherit',
        group: 'Pointer Events',
        set(value) {
          if (value === 'inherit') {
            this.removeStyle(['pointerEvents']);
          } else {
            let pointerEvents = 'auto'; //default to auto
            if (this._internal.pointerEventsEnabled !== undefined) {
              pointerEvents = this._internal.pointerEventsEnabled ? 'auto' : 'none';
            }
            this.setStyle({ pointerEvents });
          }
        }
      },
      pointerEventsEnabled: {
        index: 404,
        displayName: 'Pointer Events Enabled',
        type: 'boolean',
        group: 'Pointer Events',
        default: true,
        set(value) {
          this._internal.pointerEventsEnabled = value ? true : false;
          this.setStyle({
            pointerEvents: this._internal.pointerEventsEnabled ? 'auto' : 'none'
          });
        }
      }
    });

    addInputProps(definition, {
      blockTouch: {
        index: 450,
        displayName: 'Block Pointer Events',
        group: 'Pointer Events',
        type: 'boolean'
      }
    });

    addDynamicInputPorts(definition, 'pointerEventsMode = explicit', ['pointerEventsEnabled']);

    addOutputProps(definition, {
      onClick: {
        displayName: 'Click',
        group: 'Events',
        type: 'signal',
        propPath: 'pointer'
      },
      pointerDown: {
        displayName: 'Pointer Down',
        group: 'Pointer Events',
        type: 'signal',
        propPath: 'pointer',
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
        propPath: 'pointer',
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
      },
      pointerEnter: {
        displayName: 'Pointer Enter',
        group: 'Pointer Events',
        type: 'signal',
        propPath: 'pointer',
        props: {
          onMouseEnter() {
            this.sendSignalOnOutput('pointerEnter');
          }
        }
      },
      hoverStart: {
        displayName: 'Hover Start',
        group: 'Hover Events',
        type: 'signal',
        propPath: 'pointer',
        props: {
          onMouseOver() {
            this.sendSignalOnOutput('hoverStart');
            this.setVisualStates(['hover']);
          }
        }
      },
      hoverEnd: {
        displayName: 'Hover End',
        group: 'Hover Events',
        type: 'signal',
        propPath: 'pointer',
        props: {
          onMouseLeave() {
            this.sendSignalOnOutput('hoverEnd');
            this.setVisualStates(['']);
          }
        }
      }
    });

    addPointerEventsTooltips(definition);
  },
  addDimensions(
    definition,
    { defaultSizeMode = 'explicit', contentLabel = 'Content', useDimensionConstraints = true } = {}
  ) {
    let widthCondition = 'sizeMode = explicit OR sizeMode = contentHeight';
    let heightCondition = 'sizeMode = explicit OR sizeMode = contentWidth';

    if (defaultSizeMode === 'explicit' || defaultSizeMode === 'contentHeight') {
      widthCondition += ' OR sizeMode NOT SET';
    }

    if (defaultSizeMode === 'explicit' || defaultSizeMode === 'contentWidth') {
      heightCondition += ' OR sizeMode NOT SET';
    }

    addDynamicInputPorts(definition, widthCondition, ['width']);
    addDynamicInputPorts(definition, heightCondition, ['height']);

    addInputProps(definition, {
      sizeMode: {
        index: 10,
        type: {
          name: 'enum',
          enums: [
            { value: 'explicit', label: 'Explicit' },
            { value: 'contentWidth', label: 'Content Width' },
            { value: 'contentHeight', label: 'Content Height' },
            { value: 'contentSize', label: 'Content Size' }
          ],
          allowEditOnly: true,
          sizeComp: 'mode'
        },
        group: 'Dimensions',
        displayName: 'Size Mode',
        default: defaultSizeMode,
        allowVisualStates: true
      },
      width: {
        index: 11,
        group: 'Dimensions',
        displayName: 'Width',
        type: {
          name: 'dimension',
          units: ['%', 'px', 'vw', 'vh'],
          defaultUnit: '%'
        },
        default: 100,
        allowVisualStates: true,
        onChange(value) {
          this.props.fixedWidth = value.isFixed;
        }
      },
      height: {
        index: 13,
        group: 'Dimensions',
        displayName: 'Height',
        type: {
          name: 'dimension',
          units: ['%', 'px', 'vw', 'vh'],
          defaultUnit: '%'
        },
        default: 100,
        allowVisualStates: true,
        onChange(value) {
          this.props.fixedHeight = value.isFixed;
        }
      }
    });

    if (!Noodl.deployed) {
      addDimensionTooltips(definition, contentLabel);
    }

    if (useDimensionConstraints) {
      addInputCss(definition, {
        minWidth: {
          index: 400,
          group: 'Dimension Constraints',
          displayName: 'Min Width',
          allowVisualStates: true,
          type: {
            name: 'number',
            units: ['%', 'px', 'vw', 'vh'],
            defaultUnit: '%'
          }
        },
        maxWidth: {
          index: 401,
          group: 'Dimension Constraints',
          displayName: 'Max Width',
          allowVisualStates: true,
          type: {
            name: 'number',
            units: ['%', 'px', 'vw', 'vh'],
            defaultUnit: '%'
          }
        },
        minHeight: {
          index: 402,
          group: 'Dimension Constraints',
          displayName: 'Min Height',
          allowVisualStates: true,
          type: {
            name: 'number',
            units: ['%', 'px', 'vw', 'vh'],
            defaultUnit: '%'
          }
        },
        maxHeight: {
          index: 403,
          group: 'Dimension Constraints',
          displayName: 'Max Height',
          allowVisualStates: true,
          type: {
            name: 'number',
            units: ['%', 'px', 'vw', 'vh'],
            defaultUnit: '%'
          }
        }
      });

      if (!Noodl.deployed) {
        addDimensionConstraintsTooltips(definition);
      }
    }
  },
  _addCornerRadius(definition, opts) {
    opts = opts || {};
    const defaults = opts.defaults || {};
    const styleTag = opts.styleTag;

    if (!defaults.borderRadius) defaults.borderRadius = 0;

    function defineCornerTab(definition, suffix, tabName, indexOffset) {
      const nameWithTab = (name) => `${name} ${suffix ? '(' + suffix + ')' : ''}`;

      const tab = { group: 'corners', tab: tabName, label: suffix };
      const radiusName = `border${suffix}Radius`;
      addInputs(definition, {
        [radiusName]: {
          index: 240 + indexOffset,
          displayName: 'Corner Radius',
          editorName: nameWithTab('Corner Radius'),
          group: 'Corner Radius',
          type: {
            name: 'number',
            units: ['px', '%'],
            defaultUnit: 'px'
          },
          allowVisualStates: true,
          default: defaults[radiusName],
          tab,
          set(value) {
            this._internal.borderRadius[radiusName] =
              value.value === undefined ? Number(value) + 'px' : value.value + value.unit;

            this._updateCornerRadii();
          }
        }
      });
    }

    defineCornerTab(definition, '', 'corners-all', 0);
    defineCornerTab(definition, 'TopLeft', 'corners-top-left', 1);
    defineCornerTab(definition, 'TopRight', 'corners-top-right', 2);
    defineCornerTab(definition, 'BottomRight', 'corners-bottom-right', 3);
    defineCornerTab(definition, 'BottomLeft', 'corners-bottom-left', 4);

    definition.methods._updateCornerRadii = function () {
      const b = this._internal.borderRadius;

      function setCorner(style, corner) {
        const r = `border${corner}Radius`;
        style[r] = b[r] || b.borderRadius;
      }

      const style = {};
      setCorner(style, 'TopLeft');
      setCorner(style, 'TopRight');
      setCorner(style, 'BottomRight');
      setCorner(style, 'BottomLeft');

      this.setStyle(style, styleTag);
    };

    const oldInit = definition.initialize;
    definition.initialize = function () {
      oldInit && oldInit.call(this);
      this._internal.borderRadius = { ...defaults };
      if (defaults.borderRadius) this._updateCornerRadii();
    };
  },
  addBorderInputs(definition, opts) {
    opts = opts || {};
    const defaults = opts.defaults || {};
    const styleTag = opts.styleTag;

    if (defaults.borderStyle === undefined) defaults.borderStyle = 'none';
    if (defaults.borderWidth === undefined) defaults.borderWidth = 2;
    if (defaults.borderColor === undefined) defaults.borderColor = '#000000';

    function defineBorderTab(definition, suffix, tabName, indexOffset) {
      const styleName = `border${suffix}Style`;
      const widthName = `border${suffix}Width`;
      const colorName = `border${suffix}Color`;

      let orNotSet = defaults.borderStyle !== 'none' ? 'OR borderStyle NOT SET' : '';

      if (suffix) {
        if (defaults[styleName] && defaults[styleName] !== 'none') orNotSet += `OR ${styleName} NOT SET`;
        addDynamicInputPorts(
          definition,
          `${styleName} = solid OR ${styleName} = dashed OR ${styleName} = dotted OR borderStyle = solid OR borderStyle = dashed OR borderStyle = dotted ${orNotSet}`,
          [`${widthName}`, `${colorName}`]
        );
      } else {
        addDynamicInputPorts(
          definition,
          `${styleName} = solid OR ${styleName} = dashed OR ${styleName} = dotted ${orNotSet}`,
          [`${widthName}`, `${colorName}`]
        );
      }

      const tab = { group: 'border-styles', tab: tabName, label: suffix };

      const nameWithTab = (name) => `${name} ${suffix ? '(' + suffix + ')' : ''}`;
      const index = 202 + indexOffset * 4;

      addInputs(definition, {
        [styleName]: {
          index: index + 1,
          displayName: 'Border Style',
          editorName: nameWithTab('Border Style'),
          group: 'Border Style',
          allowVisualStates: true,
          type: {
            name: 'enum',
            enums: [
              { label: 'None', value: 'none' },
              { label: 'Solid', value: 'solid' },
              { label: 'Dotted', value: 'dotted' },
              { label: 'Dashed', value: 'dashed' }
            ]
          },
          default: defaults[styleName],
          tab,
          set(value) {
            this._internal.borders[styleName] = value;
            this._updateBorders();
          }
        },
        [widthName]: {
          index: index + 2,
          displayName: 'Border Width',
          editorName: nameWithTab('Border Width'),
          group: 'Border Style',
          allowVisualStates: true,
          type: {
            name: 'number',
            units: ['px'],
            defaultUnit: 'px'
          },
          default: defaults[widthName],
          tab,
          set(value) {
            this._internal.borders[widthName] =
              value.value === undefined ? Number(value) + 'px' : value.value + value.unit;
            this._updateBorders();
          }
        },
        [colorName]: {
          index: index + 3,
          displayName: 'Border Color',
          editorName: nameWithTab('Border Color'),
          group: 'Border Style',
          type: 'color',
          default: defaults[colorName],
          allowVisualStates: true,
          tab,
          set(value) {
            this._internal.borders[colorName] = value;
            this._updateBorders();
          }
        }
      });
    }

    defineBorderTab(definition, '', 'borders-all', 0);
    defineBorderTab(definition, 'Left', 'borders-left', 1);
    defineBorderTab(definition, 'Top', 'borders-top', 2);
    defineBorderTab(definition, 'Right', 'borders-right', 3);
    defineBorderTab(definition, 'Bottom', 'borders-bottom', 4);

    definition.methods._updateBorders = function () {
      const b = this._internal.borders;

      function setBorder(style, group) {
        const width = `border${group}Width`;
        const color = `border${group}Color`;
        const borderStyle = `border${group}Style`;

        style[width] = b[width] || b.borderWidth;
        style[color] = b[color] || b.borderColor;
        style[borderStyle] = b[borderStyle] || b.borderStyle;
      }

      const style = {};
      setBorder(style, 'Top');
      setBorder(style, 'Right');
      setBorder(style, 'Bottom');
      setBorder(style, 'Left');

      this.setStyle(style, styleTag);
    };

    const oldInit = definition.initialize;
    definition.initialize = function () {
      oldInit && oldInit.call(this);
      this._internal.borders = { ...defaults };

      const hasDefaultBorders =
        defaults.borderStyle !== 'none' ||
        (defaults.borderTopStyle && defaults.borderTopStyle !== 'none') ||
        (defaults.borderRightStyle && defaults.borderRightStyle !== 'none') ||
        (defaults.borderBottomStyle && defaults.borderBottomStyle !== 'none') ||
        (defaults.borderRightStyle && defaults.borderRightStyle !== 'none');

      if (hasDefaultBorders) this._updateBorders();
    };

    this._addCornerRadius(definition, { defaults, styleTag });
  },
  addShadowInputs(definition, args) {
    args = args || {};
    const styleTag = args.styleTag;

    addDynamicInputPorts(definition, 'boxShadowEnabled = true', [
      'boxShadowOffsetX',
      'boxShadowOffsetY',
      'boxShadowInset',
      'boxShadowBlurRadius',
      'boxShadowSpreadRadius',
      'boxShadowColor'
    ]);

    addInputs(definition, {
      boxShadowEnabled: {
        index: 250,
        group: 'Box Shadow',
        displayName: 'Shadow Enabled',
        type: 'boolean',
        default: false,
        allowVisualStates: true,
        set(value) {
          this._internal.boxShadowEnabled = value;
          this._updateBoxShadow();
        }
      },
      boxShadowOffsetX: {
        index: 251,
        group: 'Box Shadow',
        displayName: 'Offset X',
        default: 0,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px'
        },
        allowVisualStates: true,
        set(value) {
          this._internal.boxShadowOffsetX = value.value + value.unit;
          this._updateBoxShadow();
        }
      },
      boxShadowOffsetY: {
        index: 252,
        group: 'Box Shadow',
        displayName: 'Offset Y',
        default: 0,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px'
        },
        allowVisualStates: true,
        set(value) {
          this._internal.boxShadowOffsetY = value.value + value.unit;
          this._updateBoxShadow();
        }
      },
      boxShadowBlurRadius: {
        index: 253,
        group: 'Box Shadow',
        displayName: 'Blur Radius',
        default: 5,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px'
        },
        allowVisualStates: true,
        set(value) {
          this._internal.boxShadowBlurRadius = value.value + value.unit;
          this._updateBoxShadow();
        }
      },
      boxShadowSpreadRadius: {
        index: 254,
        group: 'Box Shadow',
        displayName: 'Spread Radius',
        default: 2,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px'
        },
        allowVisualStates: true,
        set(value) {
          this._internal.boxShadowSpreadRadius = value.value + value.unit;
          this._updateBoxShadow();
        }
      },
      boxShadowInset: {
        index: 255,
        group: 'Box Shadow',
        displayName: 'Inset',
        type: 'boolean',
        default: false,
        allowVisualStates: true,
        set(value) {
          this._internal.boxShadowInset = value;
          this._updateBoxShadow();
        }
      },
      boxShadowColor: {
        index: 256,
        group: 'Box Shadow',
        displayName: 'Shadow Color',
        type: 'color',
        default: '#00000033',
        allowVisualStates: true,
        set(value) {
          this._internal.boxShadowColor = value;
          this._updateBoxShadow();
        }
      }
    });

    definition.methods._updateBoxShadow = function () {
      const internal = this._internal;

      if (internal.boxShadowEnabled) {
        this.setStyle(
          {
            boxShadow: `${internal.boxShadowInset ? 'inset ' : ''}${internal.boxShadowOffsetX} ${
              internal.boxShadowOffsetY
            } ${internal.boxShadowBlurRadius} ${internal.boxShadowSpreadRadius} ${internal.boxShadowColor}`
          },
          styleTag
        );
      } else {
        this.removeStyle(['boxShadow'], styleTag);
      }
    };

    const oldInit = definition.initialize;
    definition.initialize = function () {
      oldInit && oldInit.call(this);
      this._internal.boxShadowOffsetX = 0;
      this._internal.boxShadowOffsetY = 0;
      this._internal.boxShadowBlurRadius = '5px';
      this._internal.boxShadowSpreadRadius = '2px';
      this._internal.boxShadowColor = '#00000033';
    };
  },
  addIconInputs(definition, args) {
    args = args || {};

    const index = 20;

    const defaults = {
      useIcon: true,
      iconColor: '#FFFFFF'
    };

    if (args.defaults) {
      Object.assign(defaults, args.defaults);
    }

    let useIconCondition = 'useIcon = true';
    if (defaults.useIcon) {
      useIconCondition += ' OR useIcon NOT SET';
    }

    const useIconPorts = ['iconSourceType', 'iconSize'];
    if (args.enableIconPlacement) {
      useIconPorts.push('iconPlacement');
      useIconPorts.push('iconSpacing');
    }

    addDynamicInputPorts(definition, useIconCondition, useIconPorts);

    if (defaults.useIcon) {
      addDynamicInputPorts(
        definition,
        "#js (params.useIcon===true || params.useIcon===undefined) && params.iconSourceType === 'image'",
        ['iconImageSource']
      );
      addDynamicInputPorts(
        definition,
        "#js (params.useIcon===true || params.useIcon===undefined) && params.iconSourceType === 'icon'",
        ['iconIconSource', 'iconColor']
      );
    } else {
      addDynamicInputPorts(definition, 'useIcon = true AND iconSourceType = image', ['iconImageSource']);
      addDynamicInputPorts(definition, 'useIcon = true AND iconSourceType = icon', ['iconIconSource', 'iconColor']);
    }

    if (!args.hideEnableIconInput) {
      addInputProps(definition, {
        useIcon: {
          type: 'boolean',
          group: 'Icon',
          displayName: 'Enable Icon',
          default: defaults.useIcon,
          allowVisualStates: true,
          index: index
        }
      });
    }

    addInputProps(definition, {
      iconSourceType: {
        type: {
          name: 'enum',
          enums: [
            { label: 'Image', value: 'image' },
            { label: 'Icon', value: 'icon' }
          ]
        },
        group: 'Icon',
        displayName: 'Type',
        default: 'icon',
        allowVisualStates: true,
        index: index + 1
      },
      iconIconSource: {
        type: 'icon',
        displayName: 'Icon Source',
        group: 'Icon',
        allowVisualStates: true,
        index: index + 3
      }
    });

    addInputs(definition, {
      iconImageSource: {
        type: 'image',
        displayName: 'Image Source',
        group: 'Icon',
        allowVisualStates: true,
        index: index + 2,
        set(iconImageSource) {
          this.props.iconImageSource = getAbsoluteUrl(iconImageSource);
        }
      }
    });

    if (args.enableIconPlacement) {
      addInputProps(definition, {
        iconSpacing: {
          group: 'Icon',
          displayName: 'Spacing',
          default: 10,
          type: {
            name: 'number',
            units: ['px'],
            defaultUnit: 'px'
          },
          allowVisualStates: true,
          index: index + 4
        },
        iconPlacement: {
          type: {
            name: 'enum',
            enums: [
              { label: 'Left', value: 'left' },
              { label: 'Right', value: 'right' }
            ]
          },
          group: 'Icon',
          displayName: 'Placement',
          default: 'left',
          allowVisualStates: true,
          index: index + 5
        }
      });
    }

    addInputProps(definition, {
      iconSize: {
        group: 'Icon',
        displayName: 'Size',
        default: 16,
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px'
        },
        allowVisualStates: true,
        index: index + 6
      },
      iconColor: {
        group: 'Icon',
        displayName: 'Color',
        editorName: 'Icon Color',
        default: defaults.iconColor,
        type: 'color',
        allowVisualStates: true,
        index: index + 7
      }
    });
  },

  addLabelInputs(definition, args) {
    args = args || {};

    const defaults = {
      useLabel: false
    };

    if (args.defaults) {
      Object.assign(defaults, args.defaults);
    }

    const condition = defaults.useLabel ? 'useLabel = true OR useLabel NOT SET' : 'useLabel = true';

    const textStylePortPrefix = args.styleTag || '';

    const ports = ['label'].concat(
      ['textStyle', 'fontFamily', 'fontSize', 'color', 'letterSpacing', 'lineHeight', 'textTransform'].map(
        (port) => textStylePortPrefix + port
      )
    );
    if (args.enableSpacing) {
      ports.push('labelSpacing');
    }

    addDynamicInputPorts(definition, condition, ports);

    addInputProps(definition, {
      useLabel: {
        index: 18,
        type: 'boolean',
        displayName: 'Enable Label',
        group: 'Label',
        default: defaults.useLabel
      },
      label: {
        type: 'string',
        displayName: 'Label',
        group: 'Label',
        default: 'Label'
      }
    });

    if (args.enableSpacing) {
      addInputProps(definition, {
        labelSpacing: {
          displayName: 'Spacing',
          group: 'Label',
          type: {
            name: 'number',
            units: ['px'],
            defaultUnit: 'px'
          },
          default: 10
        }
      });
    }

    this.addTextStyleInputs(definition, {
      ...args,
      group: 'Label Text Style',
      popout: {
        group: 'label-text-style',
        label: 'Text Style',
        parentGroup: 'Label'
      }
    });
  },

  addTextStyleInputs(definition, args) {
    args = args || {};

    const group = args.group || 'Text Style';
    const styleTag = args.styleTag;

    const portPrefix = args.hasOwnProperty('portPrefix') ? args.portPrefix : args.styleTag || '';

    const textStyleInputName = portPrefix + 'textStyle';

    const index = args.portIndex !== undefined ? args.portIndex : 19;

    function prettyName(name) {
      return args.displayName ? args.displayName + ' ' + name : name;
    }

    addInputs(definition, {
      [textStyleInputName]: {
        index: index,
        type: {
          name: 'textStyle',
          childPorts: ['fontFamily', 'fontSize', 'color', 'letterSpacing', 'lineHeight', 'textTransform'],
          childPortPrefix: portPrefix
        },
        group: group,
        displayName: 'Text Style',
        editorName: prettyName('Text Style'),
        default: 'None',
        set(value) {
          this.props[textStyleInputName] = this.context.styles.getTextStyle(value);
          this.forceUpdate();
        },
        allowVisualStates: true,
        popout: args.popout
      },
      [portPrefix + 'fontFamily']: {
        index: index + 1,
        type: {
          name: 'font',
          parentPort: textStyleInputName
        },
        group: group,
        displayName: 'Font Family',
        editorName: prettyName('Font Family'),
        set(value) {
          if (value) {
            let family = value;
            if (family.split('.').length > 1) {
              FontLoader.instance.loadFont(family);
              family = family.replace(/\.[^/.]+$/, '');
              family = family.split('/').pop();
            }
            this.setStyle({ fontFamily: family }, styleTag);
          } else {
            this.removeStyle(['fontFamily'], styleTag);
          }

          if (this.props[textStyleInputName]) {
            this.forceUpdate();
          }
        },
        allowVisualStates: true,
        popout: args.popout
      }
    });

    addInputCss(definition, {
      [portPrefix + 'fontSize']: {
        index: index + 2,
        group: group,
        displayName: 'Font Size',
        editorName: prettyName('Font Size'),
        targetStyleProperty: 'fontSize',
        type: {
          name: 'number',
          units: ['px'],
          defaultUnit: 'px',
          parentPort: textStyleInputName
        },
        onChange() {
          if (this.props[textStyleInputName]) {
            this.forceUpdate();
          }
        },
        allowVisualStates: true,
        popout: args.popout,
        styleTag
      },
      [portPrefix + 'color']: {
        index: index + 3,
        type: {
          name: 'color',
          parentPort: textStyleInputName
        },
        displayName: 'Color',
        editorName: prettyName('Color'),
        group: group,
        targetStyleProperty: 'color',
        allowVisualStates: true,
        popout: args.popout,
        styleTag,
        onChange() {
          if (this.props[textStyleInputName]) {
            this.forceUpdate();
          }
        }
      },
      [portPrefix + 'letterSpacing']: {
        index: index + 4,
        group: group,
        displayName: 'Letter Spacing',
        editorName: prettyName('Letter Spacing'),
        targetStyleProperty: 'letterSpacing',
        type: {
          name: 'number',
          units: ['px', 'em'],
          defaultUnit: 'px'
        },
        allowVisualStates: true,
        popout: args.popout,
        styleTag,
        default: 'Auto',
        applyDefault: false,
        onChange() {
          if (this.props[textStyleInputName]) {
            this.forceUpdate();
          }
        }
      },
      [portPrefix + 'lineHeight']: {
        index: index + 5,
        group: group,
        displayName: 'Line Height',
        editorName: prettyName('Line Height'),
        targetStyleProperty: 'lineHeight',
        type: {
          name: 'number',
          units: ['', 'px', '%'],
          defaultUnit: '',
          parentPort: textStyleInputName
        },
        allowVisualStates: true,
        onChange() {
          if (this.props[textStyleInputName]) {
            this.forceUpdate();
          }
        },
        popout: args.popout,
        styleTag,
        default: 'Auto',
        applyDefault: false
      },
      [portPrefix + 'textTransform']: {
        index: index + 6,
        group: group,
        displayName: 'Case',
        editorName: prettyName('Case'),
        applyDefault: false,
        targetStyleProperty: 'textTransform',
        type: {
          name: 'enum',
          enums: [
            { label: 'None', value: 'none' },
            { label: 'Uppercase', value: 'uppercase' },
            { label: 'Lowercase', value: 'lowercase' },
            { label: 'Capitalize', value: 'capitalize' }
          ],
          parentPort: textStyleInputName
        },
        default: 'none',
        popout: args.popout,
        styleTag,
        allowVisualStates: true,
        onChange() {
          if (this.props[textStyleInputName]) {
            this.forceUpdate();
          }
        }
      }
    });

    const fontFamilyPort = portPrefix + 'fontFamily';

    definition.setup = function (context, graphModel) {
      graphModel.on('nodeAdded.' + definition.name, function (node) {
        if (node.parameters[fontFamilyPort] && node.parameters[fontFamilyPort].split('.').length > 1) {
          FontLoader.instance.loadFont(node.parameters[fontFamilyPort]);
        }
        node.on('parameterUpdated', function (event) {
          if (event.name === fontFamilyPort && event.value) {
            if (event.value.split('.').length > 1) {
              FontLoader.instance.loadFont(event.value);
            }
          }
        });
      });
    };
  }
};

function addDimensionTooltips(definition, contentLabel) {
  definition.inputProps.sizeMode.tooltip = {
    explicit: {
      standard: 'Explicit width & height',
      extended: createTooltip({
        title: 'Explicit width & height',
        body: 'Set width & height explicitly in pixels(px), percentage(%) or viewport size(vh/vw).',
        images: [{ src: 'size-mode-explicit.svg' }]
      })
    },
    contentWidth: {
      standard: `${contentLabel} width & explicit height`,
      extended: createTooltip({
        title: `${contentLabel} width & explicit height`,
        body: `The width will match the width of the ${contentLabel.toLowerCase()}. Height is set explicitly.`,
        images: [{ src: 'size-mode-content-width.svg' }]
      })
    },
    contentHeight: {
      standard: `Explicit width & ${contentLabel.toLowerCase()} height`,
      extended: createTooltip({
        title: `Explicit width & ${contentLabel.toLowerCase()} height`,
        body: `The width is set explicitly. The height will match the height of the ${contentLabel.toLowerCase()}`,
        images: [{ src: 'size-mode-content-height.svg' }]
      })
    },
    contentSize: {
      standard: `${contentLabel} width & height`,
      extended: createTooltip({
        title: `${contentLabel} width & height`,
        body: `The width and height will match the size of the ${contentLabel.toLowerCase()}`,
        images: [{ src: 'size-mode-content-size.svg' }]
      })
    }
  };

  const unitsBodyText = [
    "- %: Relative to parents size. If 'fixed' is false this element will resize to share space with siblings. If 'Clip Content' is disabled, it'll also expand to fit the boundaries of all its content",
    '- px: Pixels',
    '- vw: Relative to viewport width. 100 makes the element the same width as the screen',
    '- vh: Relative to viewport height. 100 makes the element the same height as the screen'
  ];

  const fixedTooltip = createTooltip({
    title: 'Fixed',
    body: [
      '- Enabled: Elements will be the exact size set',
      '- Disabled: Element will resize to fill up empty space, or shrink to make space for siblings. Use the dimension constraints, min and max size, to control the boundaries'
    ]
  });

  definition.inputProps.width.tooltip = {
    dimension: createTooltip({
      title: 'Width',
      body: unitsBodyText
    }),
    fixed: fixedTooltip
  };

  definition.inputProps.height.tooltip = {
    dimension: createTooltip({
      title: 'Height',
      body: unitsBodyText
    }),
    fixed: fixedTooltip
  };
}

function addDimensionConstraintsTooltips(definition) {
  definition.inputCss.minWidth.tooltip = createTooltip({
    title: 'Minimum width',
    body: "This is prioritized over other properties, so the element won't shrink below this size"
  });

  definition.inputCss.minHeight.tooltip = createTooltip({
    title: 'Minimum height',
    body: "This is prioritized over other properties, so the element won't shrink below this size"
  });

  definition.inputCss.maxWidth.tooltip = createTooltip({
    title: 'Maximum width',
    body: "This is prioritized over other properties, so the element won't grow beyond this size"
  });

  definition.inputCss.maxHeight.tooltip = createTooltip({
    title: 'Maximum height',
    body: "This is prioritized over other properties, so the element won't grow beyond this size"
  });
}

function addPointerEventsTooltips(definition) {
  definition.inputs.pointerEventsMode.tooltip = createTooltip({
    title: 'Pointer events mode',
    body: [
      'Control if mouse and touch events are enabled on this node',
      '- Inherit: Same settings as parent',
      '- Explicit: Enable control on this element'
    ]
  });
  definition.inputs.pointerEventsEnabled.tooltip = createTooltip({
    title: 'Pointer events enabled',
    body: [
      '- Enabled: This element will receive mouse and touch events',
      '- Disabled: No mouse or touch events will be captured by this element and the element below will receive it instead'
    ]
  });
}

function addPositionAndAlignTooltips(definition) {
  definition.inputCss.position.tooltip = createTooltip({
    title: 'Position',
    images: [
      {
        label: 'Relative',
        body: 'Relative to its siblings',
        src: 'position-relative.svg'
      },
      {
        label: 'Absolute',
        body: "Not affected by siblings or parent's layout",
        src: 'position-absolute.svg'
      },
      {
        label: 'Sticky',
        body: "Stick to parent's edge on overflow",
        src: 'position-sticky.svg'
      },
      {
        label: 'Fixed',
        body: 'Always stay in the same place and take no space in the layout',
        src: 'position-sticky.svg'
      }
    ]
  });
}

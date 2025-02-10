import { Group } from '../../components/visual/Group';
import { flexDirectionValues } from '../../constants/flex';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';
import { createTooltip } from '../../tooltips';

const GroupNode = {
  name: 'Group',
  docs: 'https://docs.noodl.net/nodes/basic-elements/group',
  connectionPanel: {
    groupPriority: ['General', 'Style', 'Events', 'Mounted', 'Hover Events', 'Pointer Events', 'Focus', 'Scroll']
  },
  initialize() {
    this.props.attrs = {};
    this._internal = {
      scrollElementDuration: 500,
      scrollIndexDuration: 500,
      scrollIndex: 0
    };
    this.props.layout = 'column';
  },
  getReactComponent() {
    return Group;
  },
  noodlNodeAsProp: true,
  visualStates: [
    { name: 'neutral', label: 'Neutral' },
    { name: 'hover', label: 'Hover' }
  ],
  defaultCss: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column'
  },
  inputs: {
    flexDirection: {
      //don't rename for backwards compat
      index: 12,
      displayName: 'Layout',
      group: 'Layout',
      type: {
        name: 'enum',
        enums: [
          { label: 'None', value: 'none' },
          { label: 'Vertical', value: 'column' },
          { label: 'Horizontal', value: 'row' }
        ]
      },
      default: 'column',
      set(value) {
        this.props.layout = value;

        if (value !== 'none') {
          this.setStyle({ flexDirection: value });
        } else {
          this.removeStyle(['flexDirection']);
        }

        if (this.context.editorConnection) {
          // Send warning if the value is wrong
          if (value !== 'none' && !flexDirectionValues.includes(value)) {
            this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'layout-warning', {
              message: 'Invalid Layout value has to be a valid flex-direction value.'
            });
          } else {
            this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'layout-warning');
          }
        }

        this.forceUpdate();
      }
    },
    'scrollToIndex.do': {
      displayName: 'Scroll To Index - Do',
      group: 'Scroll To Index',
      type: 'signal',
      index: 505,
      valueChangedToTrue() {
        this.scheduleAfterInputsHaveUpdated(() => {
          if (!this.innerReactComponentRef) return;
          const childIndex = this._internal.scrollIndex;
          const duration = this._internal.scrollIndexDuration;
          this.innerReactComponentRef.scrollToIndex(childIndex, duration);
        });
      }
    },
    'scrollToElement.do': {
      displayName: 'Scroll To Element - Do',
      group: 'Scroll To Element',
      type: 'signal',
      index: 500,
      valueChangedToTrue() {
        if (!this.innerReactComponentRef) return;
        this.scheduleAfterInputsHaveUpdated(() => {
          const element = this._internal.scrollElement;
          const duration = this._internal.scrollElementDuration;
          this.innerReactComponentRef.scrollToElement(element, duration);
        });
      }
    },
    'scrollToElement.element': {
      displayName: 'Scroll To Element - Element',
      group: 'Scroll To Element',
      type: 'reference',
      index: 501,
      set(value) {
        this._internal.scrollElement = value;
      }
    },
    'scrollToElement.duration': {
      displayName: 'Scroll To Element - Duration',
      group: 'Scroll To Element',
      type: 'number',
      default: 500,
      index: 502,
      set(value) {
        this._internal.scrollElementDuration = value;
      }
    },
    'scrollToIndex.index': {
      displayName: 'Scroll To Index - Index',
      group: 'Scroll To Index',
      type: 'number',
      default: 0,
      index: 506,
      set(value) {
        this._internal.scrollIndex = value;
      }
    },
    'scrollToIndex.duration': {
      displayName: 'Scroll To Index - Duration',
      group: 'Scroll To Index',
      type: 'number',
      default: 500,
      index: 507,
      set(value) {
        this._internal.scrollIndexDuration = value;
      }
    },
    focus: {
      displayName: 'Focus',
      type: 'signal',
      group: 'Focus',
      valueChangedToTrue() {
        this.context.setNodeFocused(this, true);
      }
    },
    testId: {
      index: 100009,
      displayName: 'Test ID Attribute',
      group: 'Advanced HTML',
      type: 'string',
      set(value) {
        this.props.attrs["data-testid"] = value;
        this.forceUpdate();
      }
    }
  },
  inputProps: {
    clip: {
      index: 19,
      displayName: 'Clip Content',
      type: 'boolean',
      group: 'Layout',
      default: false
    },
    scrollEnabled: {
      index: 54,
      group: 'Scroll',
      displayName: 'Enable Scroll',
      type: 'boolean',
      default: false
    },
    scrollSnapEnabled: {
      index: 55,
      displayName: 'Snap',
      group: 'Scroll',
      type: 'boolean',
      default: false
    },
    scrollSnapToEveryItem: {
      index: 56,
      displayName: 'Snap To Every Item',
      group: 'Scroll',
      type: 'boolean',
      default: false
    },
    showScrollbar: {
      index: 57,
      displayName: 'Show Scrollbar',
      group: 'Scroll',
      type: 'boolean',
      default: false
    },
    scrollBounceEnabled: {
      index: 58,
      displayName: 'Bounce at boundaries',
      group: 'Scroll',
      type: 'boolean',
      default: true
    },
    nativeScroll: {
      index: 60,
      group: 'Scroll',
      displayName: 'Native platform scroll',
      type: 'boolean',
      default: true
    },
    as: {
      index: 100000,
      group: 'Advanced HTML',
      displayName: 'Tag',
      type: {
        name: 'enum',
        enums: [
          { label: '<div>', value: 'div' },
          { label: '<section>', value: 'section' },
          { label: '<article>', value: 'article' },
          { label: '<aside>', value: 'aside' },
          { label: '<nav>', value: 'nav' },
          { label: '<header>', value: 'header' },
          { label: '<footer>', value: 'footer' },
          { label: '<main>', value: 'main' },
          { label: '<span>', value: 'span' }
        ]
      },
      default: 'div'
    }
  },
  inputCss: {
    alignItems: {
      index: 13,
      group: 'Align and justify content',
      displayName: 'Align Items',
      type: {
        name: 'enum',
        enums: [
          { label: 'Start', value: 'flex-start' },
          { label: 'End', value: 'flex-end' },
          { label: 'Center', value: 'center' }
        ],
        alignComp: 'align-items'
      },
      default: 'flex-start'
    },
    justifyContent: {
      index: 14,
      group: 'Align and justify content',
      displayName: 'Justify Content',
      type: {
        name: 'enum',
        enums: [
          { label: 'Start', value: 'flex-start' },
          { label: 'End', value: 'flex-end' },
          { label: 'Center', value: 'center' },
          { label: 'Space Between', value: 'space-between' },
          { label: 'Space Around', value: 'space-around' },
          { label: 'Space Evenly', value: 'space-evenly' }
        ],
        alignComp: 'justify-content'
      },
      default: 'flex-start',
      applyDefault: false
    },
    flexWrap: {
      index: 15,
      displayName: 'Multi Line Wrap',
      group: 'Layout',
      type: {
        name: 'enum',
        enums: [
          { label: 'Off', value: 'nowrap' },
          { label: 'On', value: 'wrap' },
          { label: 'On Reverse', value: 'wrap-reverse' }
        ]
      },
      default: 'nowrap',
      onChange(value) {
        this.props.flexWrap = value;
        this.forceUpdate(); //scroll direction needs to be recomputed
      },
      applyDefault: false
    },
    alignContent: {
      index: 16,
      group: 'Layout',
      displayName: 'Align Content',
      type: {
        name: 'enum',
        enums: [
          { label: 'Start', value: 'flex-start' },
          { label: 'End', value: 'flex-end' },
          { label: 'Center', value: 'center' },
          { label: 'Space Between', value: 'space-between' },
          { label: 'Space Around', value: 'space-around' },
          { label: 'Space Evenly', value: 'space-evenly' }
        ],
        alignComp: 'align-content'
      }
      // default: 'flex-start'
    },
    rowGap: {
      index: 17,
      displayName: 'Vertical Gap',
      group: 'Layout',
      type: {
        name: 'number',
        units: ['px', '%', 'em'],
        defaultUnit: 'px'
      },
      default: 0,
      applyDefault: false
    },
    columnGap: {
      index: 18,
      displayName: 'Horizontal Gap',
      group: 'Layout',
      type: {
        name: 'number',
        units: ['px', '%', 'em'],
        defaultUnit: 'px'
      },
      default: 0,
      applyDefault: false
    },
    backgroundColor: {
      index: 201,
      displayName: 'Background Color',
      group: 'Style',
      type: 'color',
      default: 'transparent',
      applyDefault: false,
      allowVisualStates: true
    }
  },
  outputProps: {
    onScrollPositionChanged: {
      displayName: 'Scroll Position',
      type: 'number',
      group: 'Scroll'
    },
    onScrollStart: {
      displayName: 'Scroll Start',
      type: 'signal',
      group: 'Scroll'
    },
    onScrollEnd: {
      displayName: 'Scroll End',
      type: 'signal',
      group: 'Scroll'
    }
  },
  outputs: {
    focused: {
      displayName: 'Focused',
      type: 'signal',
      group: 'Focus'
    },
    focusLost: {
      displayName: 'Focus Lost',
      type: 'signal',
      group: 'Focus'
    }
  },
  dynamicports: [
    {
      condition: 'flexDirection != none',
      inputs: ['scrollEnabled']
    },
    {
      condition: 'flexDirection != none AND scrollEnabled = true',
      inputs: ['nativeScroll']
    },
    {
      condition: 'flexDirection != none AND scrollEnabled = true AND nativeScroll = false',
      inputs: [
        'scrollBounceEnabled',
        'scrollSnapEnabled',
        'showScrollbar',
        'scrollToElement.do',
        'scrollToElement.element',
        'scrollToElement.duration',
        'scrollToIndex.do',
        'scrollToIndex.index',
        'scrollToIndex.duration'
      ]
    },
    {
      condition: 'flexDirection != none AND scrollEnabled = true AND scrollSnapEnabled = true',
      inputs: ['scrollSnapToEveryItem']
    },
    {
      condition: 'flexDirection != none',
      inputs: ['flexWrap']
    },
    {
      condition: 'flexWrap = wrap OR flexWrap = wrap-reverse',
      inputs: ['alignContent']
    },
    {
      condition: 'flexDirection = row OR flexWrap = wrap OR flexWrap = wrap-reverse',
      inputs: ['columnGap']
    },
    {
      condition: 'flexDirection = column OR flexWrap = wrap OR flexWrap = wrap-reverse',
      inputs: ['rowGap']
    }
  ],
  methods: {
    _focus() {
      this.sendSignalOnOutput('focused');
    },
    _blur() {
      this.sendSignalOnOutput('focusLost');
    }
  }
};

NodeSharedPortDefinitions.addDimensions(GroupNode);
NodeSharedPortDefinitions.addTransformInputs(GroupNode);
NodeSharedPortDefinitions.addSharedVisualInputs(GroupNode);
NodeSharedPortDefinitions.addPaddingInputs(GroupNode);
NodeSharedPortDefinitions.addMarginInputs(GroupNode);
NodeSharedPortDefinitions.addAlignInputs(GroupNode);
NodeSharedPortDefinitions.addPointerEventOutputs(GroupNode);
NodeSharedPortDefinitions.addBorderInputs(GroupNode);
NodeSharedPortDefinitions.addShadowInputs(GroupNode);

function defineTooltips(node) {
  node.inputProps.clip.tooltip = createTooltip({
    title: 'Clip content',
    body: 'Controls if elements that are too big to fit will be clipped',
    images: [
      { src: 'clip-enabled.svg', label: 'Enabled' },
      { src: 'clip-disabled.svg', label: 'Disabled' }
    ]
  });

  node.inputCss.flexWrap.tooltip = createTooltip({
    title: 'Multiline wrap',
    body: "Elements will wrap to the next line when there's not enough space",
    images: [
      { src: 'multiline-h.svg', body: 'Using a horizontal layout' },
      { src: 'multiline-v.svg', body: 'Using a vertical layout' }
    ]
  });
}

// eslint-disable-next-line no-undef
if (!Noodl.runDeployed) {
  defineTooltips(GroupNode);
}

export default createNodeFromReactComponent(GroupNode);

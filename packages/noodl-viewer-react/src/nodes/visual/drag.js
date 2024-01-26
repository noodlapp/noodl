import { Drag } from '../../components/visual/Drag';
import { createNodeFromReactComponent } from '../../react-component-node';

const DragNode = {
  name: 'Drag',
  docs: 'https://docs.noodl.net/nodes/utilities/drag',
  allowChildren: true,
  noodlNodeAsProp: true,
  getReactComponent() {
    return Drag;
  },
  initialize() {
    this._internal.snapPositionX = 0;
    this._internal.snapPositionY = 0;
    this._internal.snapDurationX = 300;
    this._internal.snapDurationY = 300;
  },
  inputs: {
    'snapToPositionX.do': {
      group: 'Snap To Position X',
      displayName: 'Do',
      editorName: 'Do|Snap To Position X',
      type: 'signal',
      valueChangedToTrue() {
        this.scheduleAfterInputsHaveUpdated(() => {
          const { snapPositionX, snapDurationX } = this._internal;
          this.innerReactComponentRef && this.innerReactComponentRef.snapToPositionX(snapPositionX, snapDurationX);
        });
      }
    },
    'snapToPositionX.value': {
      default: 0,
      group: 'Snap To Position X',
      displayName: 'Value',
      editorName: 'Value|Snap To Position X',
      type: 'number',
      set(value) {
        this._internal.snapPositionX = value;
      }
    },
    'snapToPositionX.duration': {
      default: 300,
      group: 'Snap To Position X',
      displayName: 'Duration',
      editorName: 'Duration|Snap To Position X',
      type: 'number',
      set(value) {
        this._internal.snapDurationX = value;
      }
    },
    'snapToPositionY.do': {
      group: 'Snap To Position Y',
      displayName: 'Do',
      editorName: 'Do|Snap To Position Y',
      type: 'signal',
      valueChangedToTrue() {
        this.scheduleAfterInputsHaveUpdated(() => {
          const { snapPositionY, snapDurationY } = this._internal;
          this.innerReactComponentRef && this.innerReactComponentRef.snapToPositionY(snapPositionY, snapDurationY);
        });
      }
    },
    'snapToPositionY.value': {
      default: 0,
      group: 'Snap To Position Y',
      displayName: 'Value',
      editorName: 'Value|Snap To Position Y',
      type: 'number',
      set(value) {
        this._internal.snapPositionY = value;
      }
    },
    'snapToPositionY.duration': {
      default: 300,
      group: 'Snap To Position Y',
      displayName: 'Duration',
      editorName: 'Duration|Snap To Position Y',
      type: 'number',
      set(value) {
        this._internal.snapDurationY = value;
      }
    }
  },
  inputProps: {
    enabled: {
      group: 'Drag',
      displayName: 'Enabled',
      type: 'boolean',
      default: true
    },
    axis: {
      group: 'Drag',
      displayName: 'Axis',
      type: {
        name: 'enum',
        enums: [
          { label: 'X', value: 'x' },
          { label: 'Y', value: 'y' },
          { label: 'Both', value: 'both' }
        ]
      },
      default: 'x'
    },
    useParentBounds: {
      group: 'Drag',
      displayName: 'Constrain to parent',
      type: 'boolean',
      default: true
    },
    inputPositionX: {
      displayName: 'Start Drag X',
      type: {
        name: 'number'
      }
    },
    inputPositionY: {
      displayName: 'Start Drag Y',
      type: {
        name: 'number'
      }
    },
    scale: {
      displayName: 'Scale',
      default: 1.0,
      type: {
        name: 'number'
      }
    }
  },
  outputProps: {
    onStart: {
      group: 'Signals',
      type: 'signal',
      displayName: 'Drag Started'
    },
    onStop: {
      group: 'Signals',
      type: 'signal',
      displayName: 'Drag Ended'
    },
    onDrag: {
      group: 'Signals',
      type: 'signal',
      displayName: 'Drag Moved'
    },
    positionX: {
      group: 'Values',
      displayName: 'Drag X',
      type: 'number'
    },
    positionY: {
      group: 'Values',
      displayName: 'Drag Y',
      type: 'number'
    },
    deltaX: {
      group: 'Values',
      displayName: 'Delta X',
      type: 'number'
    },
    deltaY: {
      group: 'Values',
      displayName: 'Delta Y',
      type: 'number'
    }
  }
};

export default createNodeFromReactComponent(DragNode);

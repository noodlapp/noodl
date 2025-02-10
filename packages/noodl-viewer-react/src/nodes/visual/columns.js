import { Columns } from '../../components/visual/Columns';
import { createNodeFromReactComponent } from '../../react-component-node';

const ColumnsNode = {
  name: 'net.noodl.visual.columns',
  displayName: 'Columns',
  docs: 'https://docs.noodl.net/nodes/basic-elements/columns',
  allowChildren: true,
  noodlNodeAsProp: true,
  connectionPanel: {
    groupPriority: [
      'General',
      'Style',
      'Actions',
      'Events',
      'States',
      'Mounted',
      'Label',
      'Label Text Style',
      'Hover Events',
      'Pointer Events',
      'Focus Events'
    ]
  },

  initialize() {    this.props.attrs = {};
    this.props.layoutString = '1 2 1';
    this.props.minWidth = 0;
    this.props.marginX = 16;
    this.props.marginY = 16;
    this.props.direction = 'row';
    this.props.justifyContent = 'flex-start';
  },

  getReactComponent() {
    return Columns;
  },

  inputs: {
    layoutString: {
      group: 'Layout Settings',
      displayName: 'Layout String',
      type: 'string',
      default: '1 2 1',
      set(value) {
        this.props.layoutString = value;

        if (typeof value !== 'string') {
          this.context.editorConnection.sendWarning(
            this.nodeScope.componentOwner.name,
            this.id,
            'layout-type-warning',
            {
              message: 'Layout String needs to be a string.'
            }
          );
        } else {
          this.context.editorConnection.clearWarning(
            this.nodeScope.componentOwner.name,
            this.id,
            'layout-type-warning'
          );
        }

        this.forceUpdate();
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
    marginX: {
      group: 'Layout Settings',
      displayName: 'Horizontal Gap',
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      default: 16
    },
    marginY: {
      group: 'Layout Settings',
      displayName: 'Vertical Gap',
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      default: 16
    },
    minWidth: {
      group: 'Constraints',
      displayName: 'Min Column Width',
      type: {
        name: 'number',
        units: ['px'],
        defaultUnit: 'px'
      },
      default: 0
    },
    direction: {
      group: 'Layout Settings',
      displayName: 'Layout Direction',
      type: {
        name: 'enum',
        enums: [
          {
            label: 'Horizontal',
            value: 'row'
          },
          {
            label: 'Vertical',
            value: 'column'
          }
        ]
      },
      default: 'row'
    },
    justifyContent: {
      group: 'Justify Content',
      displayName: 'Justify Content',
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
    }
  }
};

export default createNodeFromReactComponent(ColumnsNode);

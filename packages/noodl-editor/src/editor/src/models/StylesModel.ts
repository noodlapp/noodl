import { UndoQueue } from '@noodl-models/undo-queue-model';

import Model from '../../../shared/model';
import { EventDispatcher } from '../../../shared/utils/EventDispatcher';
import { ProjectModel } from './projectmodel';

export class StylesModel extends Model {
  styles: any;

  constructor() {
    super();
    this.styles = ProjectModel.instance.getMetaData('styles') || {};

    this.bindListeners();
  }

  bindListeners() {
    const onStylesUpdated = () => {
      this.styles = ProjectModel.instance.getMetaData('styles') || {};
      this.notifyListeners('stylesChanged', { type: 'text' });
      this.notifyListeners('stylesChanged', { type: 'colors' });
    };

    EventDispatcher.instance.on(
      ['ProjectModel.importComplete', 'ProjectModel.instanceHasChanged'],
      () => {
        if (ProjectModel.instance) {
          onStylesUpdated();
        }
      },
      this
    );

    EventDispatcher.instance.on(
      'ProjectModel.metadataChanged',
      ({ key }) => {
        if (key === 'styles') {
          onStylesUpdated();
        }
      },
      this
    );
  }

  unbindListeners() {
    EventDispatcher.instance.off(this);
  }

  dispose() {
    this.unbindListeners();
    this.removeAllListeners();
  }

  store() {
    this.unbindListeners();
    ProjectModel.instance.setMetaData('styles', this.styles);
    this.bindListeners();
  }

  getStyles(type) {
    return Object.keys(this.styles[type] || {}).map((name) => {
      return {
        name,
        style: this.styles[type][name]
      };
    });
  }

  styleExists(type, name) {
    const styles = this.styles[type];
    return styles && styles.hasOwnProperty(name);
  }

  deleteStyle(type, name, args?) {
    if (!this.styles[type] || !this.styleExists(type, name)) return;

    const style = this.styles[type][name];
    delete this.styles[type][name];

    this.store();
    this.notifyListeners('stylesChanged', { type });

    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;
      undo &&
        undo.push({
          label: args.label,
          do: () => {
            this.deleteStyle(name, type);
          },
          undo: () => {
            this.setStyle(type, name, style);
          }
        });
    }
  }

  setStyle(type, name, newStyle, args?) {
    if (this.styles[type] && this.styles[type][name] === newStyle) return;

    if (!this.styles[type]) {
      this.styles[type] = {};
    }

    const prevStyle = this.styles[type][name];

    this.styles[type][name] = newStyle;
    this.store();
    this.notifyListeners('stylesChanged', { type });
    this.notifyListeners('styleChanged', { type, name, style: newStyle });

    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;
      undo &&
        undo.push({
          label: args.label,
          do: () => {
            this.setStyle(type, name, newStyle);
          },
          undo: () => {
            this.setStyle(type, name, prevStyle);
          }
        });
    }
  }

  changeStyleName(type, name, newName, args?) {
    if (!this.styleExists(type, name)) return;
    if (this.styleExists(type, newName)) return;

    const style = this.styles[type][name];
    delete this.styles[type][name];

    this.styles[type][newName] = style;

    renameStylesOnNodes(type, name, newName);

    this.store();
    this.notifyListeners('stylesChanged', { type });
    this.notifyListeners('styleRenamed', { type, oldName: name, name: newName });

    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;
      undo &&
        undo.push({
          label: args.label,
          do: () => {
            this.changeStyleName(type, name, newName);
          },
          undo: () => {
            this.changeStyleName(type, newName, name);
          }
        });
    }
  }
}

function renameStyle(nodeOrVariant, portType, name, newName) {
  const stylePortNames = nodeOrVariant
    .getPorts('input')
    .filter((p) => (p.type.name || p.type) === portType)
    .map((p) => p.name);

  if (nodeOrVariant.stateParameters) {
    for (const state of Object.keys(nodeOrVariant.stateParameters)) {
      for (const port of stylePortNames) {
        if (nodeOrVariant.stateParameters[state][port] === name) {
          nodeOrVariant.setParameter(port, newName, { state });
        }
      }
    }
  }

  if (nodeOrVariant.parameters) {
    for (const port of stylePortNames) {
      if (nodeOrVariant.parameters[port] === name) {
        nodeOrVariant.setParameter(port, newName);
      }
    }
  }
}

//TODO: this needs to work with variants and states as well
function renameStylesOnNodes(styleType, name, newName) {
  let portType;

  switch (styleType) {
    case 'text':
      portType = 'textStyle';
      break;
    case 'colors':
      portType = 'color';
      break;
    default:
      return;
  }

  //look in parameters, variants, and all visual states
  const components = ProjectModel.instance.getComponents();

  components.forEach((c) => {
    c.graph.forEachNode((node) => {
      renameStyle(node, portType, name, newName);
    });
  });

  const variants = ProjectModel.instance.getAllVariants();
  for (const variant of variants) {
    renameStyle(variant, portType, name, newName);
  }
}

import { find } from 'underscore';

import { NodeLibrary } from '@noodl-models/nodelibrary';
import { ProjectModel } from '@noodl-models/projectmodel';

import Model from '../../../../../shared/model';
import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';

export class ProjectSettingsModel extends Model {
  private project: TSFixme;
  private _ports: TSFixme;
  private type: TSFixme;
  private parameters: TSFixme;

  constructor() {
    super();

    this.project = ProjectModel.instance;

    this.loadSettings();

    const _this = this;
    NodeLibrary.instance.on(
      'libraryUpdated',
      function () {
        _this.loadSettings();
        _this.notifyListeners('settingsChanged');
      },
      this
    );

    this.bindProjectModel();

    EventDispatcher.instance.on(
      'ProjectModel.instanceHasChanged',
      (args) => {
        args.oldInstance && args.oldInstance.off(this);
        if (ProjectModel.instance === undefined) return;

        _this.project = ProjectModel.instance;
        _this.bindProjectModel();

        _this.loadSettings();
        _this.notifyListeners('settingsChanged');
      },
      this
    );
  }

  dispose() {
    NodeLibrary.instance.off(this);
    EventDispatcher.instance.off(this);
    this.project && this.project.off(this);
  }

  bindProjectModel() {
    const _this = this;

    this.project.on(
      'settingsChanged',
      function () {
        _this.loadSettings();
        _this.notifyListeners('settingsChanged');
      },
      this
    );
  }

  loadSettings() {
    this._ports = undefined;
    // NOTE: We are getting the ports here!
    this.type = NodeLibrary.instance.getProjectSettingsPorts();
    this.parameters = JSON.parse(JSON.stringify(this.project.getSettings()));
    //this.parameters.name = this.project.name; // Name of project
  }

  unbind() {
    NodeLibrary.instance.off(this);
  }

  getParameter(name) {
    return this.parameters[name] !== undefined ? this.parameters[name] : this.getPort(name).default;
  }

  getPort(name) {
    const ports = this.getPorts();
    return find(ports, function (p) {
      return p.name === name;
    });
  }

  getPorts() {
    if (this._ports) return this._ports;

    // Project name
    let ports = [
      /* {
        type:'string',
        name:'name',
        displayName:'Name',
        group:'General',
      }*/
    ];

    // Static ports
    ports = ports.concat(this.type.ports || []);

    // Dynamic ports
    //var dynamicports = NodeLibrary.instance.getDynamicPortsForNode(this);
    //if(dynamicports) ports = ports.concat(dynamicports);

    this._ports = ports;
    return ports;
  }

  setParameter(name, value) {
    /* if(name === 'name') {
      // Project name changed
      this.project.rename(value);
    }*/

    this.parameters[name] = value;

    // Push to project settings right away
    const settings = JSON.parse(JSON.stringify(this.parameters));
    //delete settings.name; // Remove the project name from settings
    this.project.setSettings(settings);

    this._ports = undefined;
    this.notifyListeners('settingsChanged');
  }

  isEmpty() {
    return this.getPorts().length === 0;
  }

  isPortConnected() {
    return false;
  }
}

const { ipcRenderer } = require('electron');
const { ProjectModel } = require('../models/projectmodel');
const Exporter = require('./exporter');
const { EventDispatcher } = require('../../../shared/utils/EventDispatcher');
const { CloudService } = require('@noodl-models/CloudServices');
const KeyboardHandler = require('@noodl-utils/keyboardhandler');

class EditorAPI {
  keyDown(evt, cb) {
    KeyboardHandler.default.instance.onKeyDown(evt);
    cb();
  }

  inspectNodes(evt, cb) {
    EventDispatcher.instance.emit('inspectNodes', { nodeIds: evt.nodeIds });
    cb();
  }

  projectGetInfo(args, cb) {
    if (ProjectModel.instance) {
      cb({ id: ProjectModel.instance.id, projectDirectory: ProjectModel.instance._retainedProjectDirectory });
    } else {
      cb({ id: null, projectDirectory: null });
    }
  }

  projectSetMetaData(args, cb) {
    ProjectModel.instance.setMetaData(args.key, args.data);
    cb();
  }

  projectGetMetaData(args, cb) {
    var data = ProjectModel.instance.getMetaData(args.key);
    cb(data);
  }

  projectGetSettings(args, cb) {
    var data = ProjectModel.instance ? ProjectModel.instance.getSettings() : undefined;
    cb(data);
  }

  async cloudServicesGetActive(args, cb) {
    const environment = await CloudService.instance.backend.fromProject(ProjectModel.instance);
    cb({
      endpoint: environment.url,
      instanceId: environment.id,
      masterKey: environment.masterKey,
      appId: environment.appId
    });
  }

  projectGetComponentBundleExport(args, cb) {
    if (!ProjectModel.instance) {
      cb();
      return;
    }

    const root = ProjectModel.instance.getRootNode();
    if (!root) {
      cb({});
    }

    if (!cachedComponentIndex) {
      const rootComponent = root.owner.owner;
      const allComponents = ProjectModel.instance.getComponents();
      cachedComponentIndex = Exporter.getComponentIndex(rootComponent, allComponents);
    }

    const json = JSON.stringify(Exporter.exportComponentBundle(ProjectModel.instance, args.name, cachedComponentIndex));
    cb(json);
  }

  handleRequest(args, fn) {
    EditorAPI.instance[args.api](args.args, function (response) {
      fn({
        api: args.api,
        token: args.token,
        response: response
      });
    });
  }
}

ipcRenderer.on('editor-api-request', function (event, args) {
  EditorAPI.instance.handleRequest(args, function (response) {
    event.sender.send('editor-api-response', response);
  });
});

EditorAPI.instance = new EditorAPI();

//optimization for bundle generation so we don't have to re-generate the component index all the time
let cachedComponentIndex = null;

var ignoreEvents = ['Model.thumbnailChanged', 'Model.warningsChanged', 'Model.myProjectsChanged'];

EventDispatcher.instance.on('Model.*', (e, name) => {
  if (ignoreEvents.includes(name)) return;
  cachedComponentIndex = null;
});

module.exports = EditorAPI;

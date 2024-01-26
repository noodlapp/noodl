import _ from 'underscore';
import { filesystem } from '@noodl/platform';

import { UndoQueue, UndoActionGroup } from '@noodl-models/undo-queue-model';
import { WarningsModel } from '@noodl-models/warningsmodel';
import { verifyJsonFile } from '@noodl-utils/verifyJson';

import Model from '../../../shared/model';
import { EventDispatcher } from '../../../shared/utils/EventDispatcher';
import Utils from '../utils/utils';
import { ComponentModel } from './componentmodel';
import LessonModel from './lessonmodel';
import { NodeGraphModel, NodeGraphNode } from './nodegraphmodel';
import { NodeLibrary } from './nodelibrary';
import { listProjectModules, ProjectModule, ProjectModuleManifest, readProjectModules } from './projectmodel.modules';
import { VariantModel } from './VariantModel';

export interface CloudServiceMetadata {
  id: string;
  endpoint: string;
  appId: string;

  /** @deprecated use `endpoint` instead. */
  url?: string;
}

export interface CloudServiceMetadataDataFormat {
  instanceId: string;
  endpoint: string;
  appId: string;
}

export type ProjectSettings =
  | {
      bodyScroll?: boolean;
      headCode?: string;
      htmlTitle?: string;
      navigationPathType?: string;
    } & Record<string, any>;

export class ProjectModel extends Model {
  public static readonly version = '1';
  public static readonly Upgraders = {
    0: function (project) {
      // Upgrade project from 0 to 1, inferred types are removed and = should become * on
      // node instance ports
      project.forEachComponent(function (c) {
        c.forEachNode(function (n) {
          _.each(n.ports, function (p) {
            if (p.type === '=') p.type = '*';
            else if (p.type.name === '=') p.type.name = '*';
          });
        });
      });

      // Project upgraded to version 1
      project.version = '1';
    },
    1: function (project) {
      // Upgrade to version 2 (support for variants, state parameters and transitions)
      project.version = '2';
    },
    2: function (project) {
      // Upgrade to version 2 (support for comments)
      project.version = '3';
    },
    3: function (project) {
      // Upgrade event senders to use string lists instead of PortEditor
      project.version = '4';
    }
  };

  // Track when the current project instance is changed, keep track of changes on the instance
  private static _instance: ProjectModel | undefined = undefined;
  public static get instance() {
    return ProjectModel._instance;
  }
  public static set instance(project: ProjectModel | undefined) {
    if (ProjectModel._instance !== project) {
      //unload old project
      if (ProjectModel._instance) {
        EventDispatcher.instance.notifyListeners('ProjectModel.instanceWillChange');
        NodeLibrary.instance.unregisterModule(ProjectModel._instance);
      }

      //and load new one, if any
      project !== undefined && NodeLibrary.instance.registerModule(project);

      const _oldInstance = ProjectModel._instance;
      ProjectModel._instance = project;
      EventDispatcher.instance.notifyListeners('ProjectModel.instanceHasChanged', {
        oldInstance: _oldInstance
      });
    }
  }

  public id?: string;
  public name?: string;
  public version?: string;
  public _retainedProjectDirectory?: string;
  public settings?: ProjectSettings;
  public metadata?: TSFixme;
  public components: ComponentModel[];
  public variants: TSFixme[];
  public modules: ProjectModule[] = [];
  public lesson: TSFixme;
  public rootNode: NodeGraphNode;
  public evaluatehealthScheduled: TSFixme;
  public componentAnnotations: TSFixme;
  public previews: TSFixme;
  public thumbnailURI: TSFixme;

  constructor(args?: TSFixme) {
    super();

    this.components = [];
    this.variants = [];
    this.settings = {};
    if (args) {
      this.name = args.name;
      this.settings = args.settings;
      // this.thumbnailURI = args.thumbnailURI;
      this.version = args.version;
      this.metadata = args.metadata;
      // this.deviceSettings = args.deviceSettings;
    }

    NodeLibrary.instance.on(
      ['moduleRegistered', 'moduleUnregistered', 'libraryUpdated'],
      () => {
        this.scheduleEvaluateHealth();
      },
      this
    );
  }

  // Load project json from directory
  static readJSONFromDirectory(retainedProjectDirectory: string, callback) {
    filesystem
      .readJson(retainedProjectDirectory + '/project.json')
      .then(callback)
      .catch((error) => {
        console.error(error);
        callback();
      });
  }

  // From local storage
  static fromLocalStorage() {
    let _this;

    const json = localStorage['project'];
    if (json) _this = ProjectModel.fromJSON(JSON.parse(json));
    else _this = new ProjectModel();

    return _this;
  }

  static fromJSON(json) {
    const _this = new ProjectModel(json);

    if (json.lesson) _this.lesson = LessonModel.fromJSON(json.lesson);

    for (const i in json.components) {
      _this.addComponent(ComponentModel.fromJSON(json.components[i]));
    }

    if (json.variants !== undefined) _this.variants = json.variants.map((v) => VariantModel.fromJSON(v));

    if (json.rootNodeId) _this.rootNode = _this.findNodeWithId(json.rootNodeId);

    // Upgrade project if necessary
    ProjectModel.upgrade(_this);

    return _this;
  }

  static setSaveOnModelChange(enabled) {
    saveOnModelChange = enabled;
    if (!saveOnModelChange) {
      clearTimeout(saveTimeout);
    }
  }

  static upgrade(project) {
    if (!project.version) project.version = '0';

    let upgrader;
    while ((upgrader = ProjectModel.Upgraders[project.version])) {
      upgrader(project);
    }
  }

  dispose() {
    for (const c in this.components) this.components[c].dispose();

    NodeLibrary.instance.off(this);
  }

  // Sets the root
  setRootNode(node: NodeGraphNode) {
    this.rootNode = node;

    this.notifyListeners('rootNodeChanged', {
      model: node
    });
  }

  setRootComponent(component: ComponentModel) {
    // First first node that can be export root
    const root = _.find(component.graph.roots, function (n) {
      return n.type.allowAsExportRoot;
    });
    if (root) this.setRootNode(root);
  }

  // Returns root
  getRootNode() {
    return this.rootNode;
  }

  public getRootComponent(): ComponentModel {
    const root = this.getRootNode();
    if (!root) {
      return;
    }

    return root.owner?.owner;
  }

  // Returns all components of the project
  getComponents(): ComponentModel[] {
    return this.components;
  }

  // Add a component to this project
  addComponent(component, args?: TSFixme) {
    const _this = this;
    component.owner = this;

    if (args && args.undo && typeof args.undo !== 'object')
      var undoGroup = (args.undo = new UndoActionGroup({
        label: args.label || 'add component'
      }));

    this.components.push(component);
    this.notifyListeners('componentAdded', {
      model: component,
      undo: args ? args.undo : undefined
    });

    NodeLibrary.instance.notifyListeners('typeAdded', {
      model: component
    });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: args.label,
        do: function () {
          _this.addComponent(component);
        },
        undo: function () {
          _this.removeComponent(component);
        }
      });

      undoGroup && UndoQueue.instance.push(undoGroup); // Push undo group if it was created
    }
  }

  duplicateComponent(component: ComponentModel, newComponentName: string, args) {
    if (args && args.undo && typeof args.undo !== 'object')
      var undoGroup = (args.undo = new UndoActionGroup({
        label: args.label || 'duplicate component'
      }));

    const newComponent = new ComponentModel({
      name: newComponentName,
      graph: NodeGraphModel.fromJSON(JSON.parse(JSON.stringify(component.graph.toJSON()))),
      id: Utils.guid()
    });

    newComponent.rekeyAllIds();
    if (args.rerouteComponentRefs) {
      newComponent.rerouteComponentRefs(
        args.rerouteComponentRefs.oldPathPrefix,
        args.rerouteComponentRefs.newPathPrefix
      );
    }

    this.addComponent(newComponent, args);
    this.notifyListeners('componentDuplicated', {
      source: component,
      duplicate: newComponent,
      undo: args ? args.undo : undefined
    });

    undoGroup && UndoQueue.instance.push(undoGroup); // Push undo group if it was created
  }

  // Remove a component from this project
  removeComponent(component: ComponentModel, args?: TSFixme) {
    const _this = this;
    const idx = this.components.indexOf(component);
    if (idx !== -1) {
      if (args && args.undo && typeof args.undo !== 'object')
        // Create undo group if none is provided already
        var undoGroup = (args.undo = new UndoActionGroup({
          label: args.label || 'remove component'
        }));

      WarningsModel.instance.clearAllWarningsForComponent(component);

      component.owner = undefined;
      this.components.splice(idx, 1);

      //reset the root node if we're deleting the root component
      if (this.rootNode?.owner?.owner === component) {
        this.setRootNode(null);
      }

      this.notifyListeners('componentRemoved', {
        model: component,
        undo: args ? args.undo : undefined
      });

      NodeLibrary.instance.notifyListeners('typeRemoved', {
        model: component
      });
      component.off(this);

      // Undo
      if (args && args.undo) {
        const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

        undo.push({
          label: args.label,
          do: function () {
            _this.removeComponent(component);
          },
          undo: function () {
            _this.addComponent(component);
          }
        });

        undoGroup && UndoQueue.instance.push(undoGroup); // Push undo group if it was created
      }

      return true;
    }
  }

  /**
   * Returns a component with a specific name
   * @param name
   * @returns
   */
  getComponentWithName(name: string): ComponentModel {
    for (const i in this.components) {
      const c = this.components[i];
      if (c.name === name) return c;
    }
    return undefined;
  }

  forEachComponent(callback: (component: ComponentModel) => void) {
    for (const i in this.components) callback(this.components[i]);
  }

  findNodeWithId(id: string): NodeGraphNode {
    for (const i in this.components) {
      const c = this.components[i];
      const node = c.graph.findNodeWithId(id);
      if (node) return node;
    }
  }

  getNodesWithType(typename: string): NodeGraphNode[] {
    const nodes = [];
    this.forEachComponent((c) => {
      c.forEachNode((n) => {
        if (n.typename === typename) nodes.push(n);
      });
    });
    return nodes;
  }

  // Rename a component of the project
  renameComponent(component: ComponentModel, newname: string, args?: TSFixme) {
    const oldName = component.name;
    component.rename(newname);

    this.notifyListeners('componentRenamed', {
      model: component,
      oldName: oldName
    });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      const _this = this;
      undo.push({
        label: args.label,
        do: function () {
          _this.renameComponent(component, newname);
        },
        undo: function () {
          _this.renameComponent(component, oldName);
        }
      });
    }
  }

  // Rename a component with a given name
  renameComponentWithName(oldname: string, newname: string, args) {
    if (this.getComponentWithName(newname)) return false;

    const c = this.getComponentWithName(oldname);
    this.renameComponent(c, newname, args);

    return true;
  }

  // Returns all components that start with the specified path
  getComponentsWithPath(path): ComponentModel[] {
    return _.filter(this.components, function (c) {
      return c.name.indexOf(path) === 0;
    });
  }

  // Moves all components that start with the specified path oldpath to
  // the new path
  moveComponentsToNewPath(oldpath: string, newpath: string, args?) {
    const _this = this;

    _.each(this.getComponentsWithPath(oldpath), function (c) {
      const newname = newpath + c.name.substring(oldpath.length);
      _this.renameComponent(c, newname, args);
    });
  }

  applySettingsPatch(p) {
    const settings = this.getSettings();
    for (const name in p) {
      const value = p[name];
      if (value === null) settings[name] = undefined;
      else settings[name] = value;
    }
    this.setSettings(settings);
  }

  // Applies a patch to the project, optionally asks user for permission
  // or notifies user
  /* applyPatch(patch) {
    var _this = this;

    function applyPatch(confirmed) {
      // Apply the regular or dismiss patches depending on if the user confirmed or not
      var patches = confirmed ? patch.nodePatches : patch.dismissPatches;
      for (var i in patches) {
        var p = patches[i];
        var node = _this.findNodeWithId(p.nodeId);
        node && node.applyPatch(p);
      }

      if (patch.settingsPatch) _this.applySettingsPatch(patch.settingsPatch);
    }

    if (patch.notifyUser) {
      // Apply the patch but and notify the user
      applyPatch(true);
      WarningsModel.instance.setWarning(
        {
          key: 'patch-' + patch.key
        },
        {
          type: 'patch-notify',
          title: 'The project has been patched',
          message: patch.message,
          onPatch: function () {
            WarningsModel.instance.setWarning(
              {
                key: 'patch-' + patch.key
              },
              undefined
            );
            applyPatch(true);
          }
        }
      );
    } else if (patch.askPermission) {
      // Ask permission, if the user declines then the dismiss patches will be applied
      // instead
      WarningsModel.instance.setWarning(
        {
          key: 'patch-' + patch.key
        },
        {
          type: 'patch-confirm',
          title: 'The project has been patched',
          message: patch.message,
          onPatch: function () {
            WarningsModel.instance.setWarning(
              {
                key: 'patch-' + patch.key
              },
              undefined
            );
            applyPatch(true);
          },
          onDismiss: function () {
            WarningsModel.instance.setWarning(
              {
                key: 'patch-' + patch.key
              },
              undefined
            );
            applyPatch(false);
          }
        }
      );
    } else {
      // Simply apply the patches
      applyPatch(true);
    }
  }*/

  // Settings
  getSettings(): ProjectSettings {
    return this.settings ? this.settings : {};
  }

  setSettings(settings) {
    this.settings = settings;
    this.notifyListeners('settingsChanged');
  }

  setSetting(name, value) {
    if (this.settings[name] === value) {
      return;
    }

    if (value === undefined) {
      delete this.settings[name];
    } else {
      this.settings[name] = value;
    }

    this.notifyListeners('settingsChanged');
  }

  resolveColor(color: string) {
    const styles = this.getMetaData('styles');
    return styles && styles.colors && styles.colors[color] ? styles.colors[color] : color;
  }

  // Name
  rename(name) {
    this.name = name;
    this.notifyListeners('renamed', {
      oldName: name
    });
  }

  // Thumbnail URI
  getThumbnailURI() {
    return this.thumbnailURI;
  }

  setThumbnailFromDataURI(uri) {
    this.thumbnailURI = uri;
    this.notifyListeners('thumbnailChanged');
  }

  // Save to directory
  toDirectory(retainedProjectDirectory, callback) {
    // This function stores the project in project json
    // First it writes to a tmp file, make sure it is correctly written and then moves it to project.json
    // This is to avoid project files becomming corrupted in the case of a process exit
    const projectJson = this.toJSON();

    //optimize the file by removing child x,y since they're calculated from the root positions during layout
    //reduces the amount of differences between versions _alot_ as well
    stripNodeChildPositions(projectJson);

    const tmpProjectPath = retainedProjectDirectory + '/project-tmp.json';

    filesystem
      .writeJson(tmpProjectPath, projectJson)
      // Make sure tmp file was written correctly
      .then(() => verifyJsonFile(tmpProjectPath))
      .then((validJson) => {
        if (!validJson) {
          callback &&
            callback({
              result: 'failure',
              message: 'Error writing project file.'
            });
          filesystem.removeFile(tmpProjectPath);
          return;
        }

        // Move tmp file to project.json
        filesystem
          .renameFile(tmpProjectPath, retainedProjectDirectory + '/project.json')
          .then(() => {
            callback &&
              callback({
                result: 'success'
              });
          })
          .catch(() => {
            callback &&
              callback({
                result: 'failure',
                message: 'Error writing project file.'
              });
          });
      })
      .catch(() => {
        callback &&
          callback({
            result: 'failure',
            message: 'Error writing project file.'
          });
      });
  }

  // Project lessons
  isLesson() {
    return this.lesson !== undefined;
  }

  getLessonModel() {
    return this.lesson;
  }

  // Copy to folder
  copyFileToProjectDirectory(file, callback) {
    if (this._retainedProjectDirectory === undefined) return;

    const target = this._retainedProjectDirectory + '/' + file.name;
    filesystem
      .makeDirectory(filesystem.dirname(target))
      .then(() => {
        filesystem
          .copyFile(file.fullPath, target)
          .then(() => {
            callback &&
              callback({
                result: 'success'
              }); // Write ended with success
          })
          .catch(() => {
            callback &&
              callback({
                result: 'failure',
                message: 'Error copying file to project directory.'
              });
          });
      })
      .catch(() => {
        callback &&
          callback({
            result: 'failure',
            message: 'Error copying file to project directory.'
          });
      });
  }

  // For each file in folder
  /*  ProjectModel.prototype._forEachFileInDirectory = function(dirEntry,callback,types) {
    var _this = this;

    var reader = dirEntry.createReader();
    reader.readEntries(function(results) {
      for(var i in results) {
        var fileEntry = results[i];

        if(fileEntry.isDirectory) {
          // Recurse into directory
          _this._forEachFileInDirectory(fileEntry,callback,types);
        }
        else {
          // Check the file ending then return the entry
          var parts = fileEntry.name.split('.');
          if(parts.length>0&&(types===undefined||types.indexOf(parts[parts.length-1].toLowerCase())!==-1)) {
            callback&&callback(fileEntry);
          }
        }
      }

    },function() {
      callback&&callback({result:'failure',message:'Failed to read project directory'});
    });
  }

  ProjectModel.prototype.forEachFileInProjectDirectory = function(callback,types) {
    var _this = this;

    if(this._retainedProjectDirectory === undefined) return;

    FileSystem.instance.restoreEntry(this._retainedProjectDirectory,function(projectDirectoryEntry) {
      _this._forEachFileInDirectory(projectDirectoryEntry,callback,types);
    });
  }*/

  _listFilesInDirectory(dirEntry, callback, args, _files?: TSFixme) {
    const _this = this;
    let files = _files ? _files : [];

    filesystem
      .listDirectory(dirEntry)
      .then((results) => {
        let dirs = 0;
        for (const i in results) {
          const fileEntry = results[i];
          if (args && args.ignoreFullPath && args.ignoreFullPath.indexOf(fileEntry.fullPath) !== -1) continue; // Ignore files if specifed

          if (fileEntry.isDirectory) {
            // Recurse into directory
            dirs++;
            _this._listFilesInDirectory(
              fileEntry.fullPath,
              function (directoryFiles) {
                if (directoryFiles) files = files.concat(directoryFiles);

                dirs--;
                if (dirs === 0) callback(files);
              },
              args
            );
          } else {
            // Check the file ending then return the entry
            const parts = fileEntry.name.split('.');
            if (
              parts.length > 0 &&
              (args === undefined ||
                args.types === undefined ||
                args.types.indexOf(parts[parts.length - 1].toLowerCase()) !== -1)
            ) {
              files.push(fileEntry);
            }
          }
        }
        if (dirs === 0) callback(files);
      })
      .catch(() => callback());
  }

  listFilesInProjectDirectory(callback, types?: TSFixme, ignoreFullPath?: TSFixme) {
    const _this = this;

    if (this._retainedProjectDirectory === undefined) return;

    _this._listFilesInDirectory(this._retainedProjectDirectory, callback, {
      types,
      ignoreFullPath
    });
  }

  listModules(callback: (modules?: ProjectModuleManifest[]) => void) {
    listProjectModules(this)
      .then(callback)
      .catch((error) => {
        console.error(error);
        callback();
      });
  }

  readModules(callback: (modules?: ProjectModule[]) => void) {
    readProjectModules(this)
      .then(callback)
      .catch((error) => {
        console.error(error);
        callback();
      });
  }

  getModuleAnnotationsForComponentWithName(name) {
    if (!this.componentAnnotations) return;
    return this.componentAnnotations[name];
  }

  /** TODO: Delete me? */
  getModulePreviews() {
    return this.previews && this.previews.length > 0 ? this.previews : undefined;
  }

  deleteComponentAllowed(component: ComponentModel): { canBeDelete: boolean; reason?: string } {
    const annotationDoesntAllow =
      this.componentAnnotations &&
      this.componentAnnotations[component.fullName] &&
      this.componentAnnotations[component.fullName].deleteAllowed === false;

    if (annotationDoesntAllow) {
      return {
        canBeDelete: false,
        reason: "This component can't be deleted"
      };
    }

    const isRootComponent = this.getRootComponent() === component;

    if (isRootComponent) {
      return {
        canBeDelete: false,
        reason: "Home component can't be deleted"
      };
    }

    return {
      canBeDelete: true
    };
  }

  renameComponentAllowed(name) {
    if (
      this.componentAnnotations &&
      this.componentAnnotations[name] &&
      this.componentAnnotations[name].renameAllowed === false
    ) {
      return false;
    }
    return true;
  }

  isComponentHidden(name) {
    if (
      this.componentAnnotations &&
      this.componentAnnotations[name] &&
      this.componentAnnotations[name].hidden === true
    ) {
      return true;
    }
    return false;
  }

  setMetaData(key: string, data) {
    if (!this.metadata) this.metadata = {};

    this.metadata[key] = data;

    EventDispatcher.instance.notifyListeners('ProjectModel.metadataChanged', {
      key,
      data
    });
  }

  getMetaData(key: string) {
    if (!this.metadata) this.metadata = {};

    return this.metadata[key];
  }

  mergeMetadata(newData) {
    if (!this.metadata) this.metadata = {};

    const merge = (target, source) => {
      // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
      for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) Object.assign(source[key], merge(target[key], source[key]));
      }

      // Join `target` and modified `source`
      Object.assign(target || {}, source);
      return target;
    };

    merge(this.metadata, newData);

    for (const key in newData) {
      EventDispatcher.instance.notifyListeners('ProjectModel.metadataChanged', {
        key,
        data: this.metadata[key]
      });
    }
  }

  createNewVariant(name, node) {
    let variant = this.variants.find((v) => v.name === name && v.typename === node.type.localName);

    if (variant !== undefined) return; // Variant already exists

    variant = new VariantModel({
      name: name,
      typename: node.type.localName
    });

    if (node.variant !== undefined) {
      // Node has a variant already, copy params
      variant.updateFromVariant(node.variant);
    }

    variant.updateFromNode(node);
    this.variants.push(variant);
    this.notifyListeners('variantCreated', {
      variant: variant
    });

    return variant;
  }

  updateVariant(name, node) {
    const variant = this.variants.find((v) => v.name === name && v.typename === node.type.localName);

    if (variant === undefined) return false; // Variant does not exist

    variant.updateFromNode(node);
    this.notifyListeners('variantUpdated', {
      variant: variant
    });

    return variant;
  }

  isVariantUsed(variant) {
    let isUsed = false;
    this.forEachComponent((c) => {
      c.forEachNode((n) => {
        if (n.variant === variant) isUsed = true;
      });
    });
    return isUsed;
  }

  addVariant(variant, args?: TSFixme) {
    const _v = this.variants.find((v) => v.name === variant.name && v.typename === variant.typename);
    if (_v !== undefined) return false; // Variant already exists

    this.variants.push(variant);
    this.notifyListeners('variantAdded', {
      variant: variant
    });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'add variant',
        do: () => {
          this.addVariant(variant);
        },
        undo: () => {
          const idx = this.variants.indexOf(variant);
          this.variants.splice(idx, 1);
          this.notifyListeners('variantDeleted', {
            variant: variant
          });
        }
      });
    }

    return true;
  }

  deleteVariant(variant, args?: TSFixme) {
    const variantIdx = this.variants.findIndex((v) => v === variant);
    if (variantIdx !== -1) {
      this.variants.splice(variantIdx, 1);
      this.notifyListeners('variantDeleted', {
        variant: variant
      });

      // Undo
      if (args && args.undo) {
        const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

        undo.push({
          label: 'rename variant',
          do: () => {
            this.deleteVariant(variant);
          },
          undo: () => {
            this.variants.push(variant);
            this.notifyListeners('variantCreated', {
              variant: variant
            });
          }
        });
      }
    }
  }

  renameVariant(variant, newName, args?: TSFixme) {
    const oldName = variant.name;
    variant.name = newName;

    this.notifyListeners('variantRenamed', {
      variant: variant,
      oldName: oldName
    });

    // Undo
    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;

      undo.push({
        label: 'rename variant',
        do: () => {
          this.renameVariant(variant, newName);
        },
        undo: () => {
          this.renameVariant(variant, oldName);
        }
      });
    }
  }

  findVariant(name, nodetype) {
    return this.variants.find((v) => v.name === name && v.typename === nodetype.localName);
  }

  findVariantsForNodeType(nodetype) {
    return this.variants.filter((v) => v.typename === nodetype.localName && v.name !== undefined);
  }

  getAllVariants() {
    return this.variants;
  }

  scheduleEvaluateHealth() {
    const _this = this;

    if (this.evaluatehealthScheduled) return;
    this.evaluatehealthScheduled = true;

    setTimeout(function () {
      _this.evaluatehealthScheduled && _this.evaluateHealth();
      _this.evaluatehealthScheduled = false;
    }, 2000);
  }

  evaluateHealth() {
    if (!NodeLibrary.instance.isLoaded()) return;
    if (this !== ProjectModel.instance) return; // Only evaluate health for main project

    //  if (!NodeLibrary.instance.isModuleRegistered(this)) return; // This module is not registered in the node library, no need to eval health
    if (this.variants !== undefined) this.variants.forEach((v) => v.evaluateHealth());

    //Check for duplicate IDs
    //Note: can happen in older projects where a component might be missing an id and it's renamed and later merged with version control
    const allNodesIds = new Set<string>();
    const duplicates: [ComponentModel, NodeGraphNode][] = [];

    for (const component of this.getComponents()) {
      component.forEachNode((node) => {
        if (allNodesIds.has(node.id)) {
          duplicates.push([component, node]);
        } else {
          allNodesIds.add(node.id);
        }
      });
    }

    if (duplicates.length) {
      console.group(
        'WARNING: The project has nodes that share the same ID, which will cause severe issues. Duplicates:'
      );
      for (const [component, node] of duplicates) {
        console.log(`Node Id: ${node.id}. Component: ${component.fullName}`);
      }
      console.groupEnd();
    }
  }

  // to - from JSON
  toJSON() {
    const json = {
      name: this.name,
      components: [],
      settings: this.settings,
      rootNodeId: this.rootNode ? this.rootNode.id : undefined,
      // thumbnailURI:this.thumbnailURI,
      version: this.version,
      lesson: this.lesson ? this.lesson.toJSON() : undefined,
      metadata: this.metadata,
      variants: this.variants.map((v) => v.toJSON())
      //   deviceSettings:this.deviceSettings,
    };
    for (const i in this.components) {
      json.components.push(this.components[i].toJSON());
    }

    //sort so the git diff is as small as possible (sometimes components get re-arranged in the array)
    json.components.sort((a, b) => a.name.localeCompare(b.name));

    return json;
  }
}

// Watch if the project root is removed
EventDispatcher.instance.on(
  'Model.nodeRemoved',
  function (e) {
    if (ProjectModel.instance && ProjectModel.instance.getRootNode() === e.args.model) {
      ProjectModel.instance.setRootNode(undefined);
    }
  },
  null
);

function stripNodeChildPositions(json) {
  function recurse(node) {
    if (!node.children) return;

    for (const child of node.children) {
      delete child.x;
      delete child.y;

      recurse(child);
    }
  }

  if (!json) return;

  json.components &&
    json.components.forEach((comp) => {
      comp.graph &&
        comp.graph.roots &&
        comp.graph.roots.forEach((root) => {
          recurse(root);
        });
    });
}

// Project saver, saves current project when a change to a model occurs
let saveOnModelChange = true;
let saveTimeout;
const ignoreEvents = [
  'Model.thumbnailChanged',
  'Model.inspectorAdded',
  'Model.inspectorRemoved',
  'Model.itemsChanged',
  'Model.activeChanged',
  'Model.warningsChanged',
  'Model.GetCurrentFrontends',
  'Model.GetAllEnvironments',
  'Model.myProjectsChanged',
  'Model.moduleRegistered',
  'Model.libraryUpdated',
  'Model.documentChanged',
  'Model.nodeSelected',
  'Model.selectNode',
  'Model.moduleUnregistered',
  'Model.exitEditor',
  'Model.lessonProgressChanged',
  'Model.instancePortsChanged',
  'Model.0',
  'Model.1',
  'Model.2'
];
EventDispatcher.instance.on(
  'Model.*',
  function (event, eventName) {
    if (ignoreEvents.indexOf(eventName) !== -1) return;
    if (!saveOnModelChange) return;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveProject, 1000);
  },
  null
);

function saveProject() {
  if (!ProjectModel.instance) return;

  if (ProjectModel.instance._retainedProjectDirectory) {
    // Project is loaded from directory, save it
    ProjectModel.instance.toDirectory(ProjectModel.instance._retainedProjectDirectory, function (r) {
      if (r.result !== 'success') {
        console.log(r.message);
        //retry in 3 seconds
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveProject, 3000);
        EventDispatcher.instance.emit('ProjectModel.saveFailedRetryScheduled');
      } else {
        console.log('Project saved ' + new Date()); // Project is saved to disk, start the watch timer
        EventDispatcher.instance.emit('ProjectModel.projectSavedToDisk');
        //startWatchTimeOut();
      }
    });
  } else {
    // The project is not loaded from a directory, store to local store
    localStorage['project'] = JSON.stringify(ProjectModel.instance.toJSON(), null, 3);
    console.log('Project stored to local storage ' + new Date());
  }
}

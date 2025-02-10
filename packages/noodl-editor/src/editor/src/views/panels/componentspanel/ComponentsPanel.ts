import _ from 'underscore';

import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphModel } from '@noodl-models/nodegraphmodel';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import { ComponentIconType, getComponentIconType } from '@noodl-models/nodelibrary/ComponentIcon';
import { ProjectModel } from '@noodl-models/projectmodel';
import { getDefaultComponent } from '@noodl-models/projectmodel.utils';
import { UndoQueue, UndoActionGroup } from '@noodl-models/undo-queue-model';
import { WarningsModel } from '@noodl-models/warningsmodel';
import { tracker } from '@noodl-utils/tracker';
import { guid } from '@noodl-utils/utils';

import { IconName } from '@noodl-core-ui/components/common/Icon';

import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';
import View from '../../../../../shared/view';
import { NodeGraphEditor } from '../../nodegrapheditor';
import * as NewPopupLayer from '../../PopupLayer/index';
import { type PopupMenuItem } from '../../PopupLayer/index';
import { ToastLayer } from '../../ToastLayer/ToastLayer';
import { ComponentsPanelFolder } from './ComponentsPanelFolder';
import { ComponentTemplates } from './ComponentTemplates';
import { HACK_findNodeReference } from '@noodl-contexts/NodeReferencesContext';

const PopupLayer = require('@noodl-views/popuplayer');
const ComponentsPanelTemplate = require('../../../templates/componentspanel.html');

// Styles
require('../../../styles/componentspanel.css');

type SheetType = {
  name: string;
  folder: TSFixme;
  isFolder: boolean;
  isDefault: boolean;
  isSelected?: boolean;
};

type ActionResult = {
  success: boolean;
  message?: string;
};

export interface ComponentsPanelOptions {
  parent?: TSFixme;
  model?: TSFixme;

  /** Lock to a specific sheet */
  lockCurrentSheetName?: string;
  /** Show the sheet section */
  showSheetList: boolean;
  /** List of sheets we want to hide */
  hideSheets?: string[];
  /** Change the title of the component header */
  componentTitle?: string;
}

export class ComponentsPanelView extends View {
  parent: TSFixme;
  model: TSFixme;

  componentScopes: {
    [key: string]: {
      folder?: ComponentsPanelFolder;
      isRoot?: boolean;
      hasWarnings?: boolean;
      comp?: TSFixme;
      canBecomeRoot?: TSFixme;
      isSelected?: boolean;
      isVisual: boolean;
    };
  };

  folderScopes: {
    [key: string]: {
      folder: ComponentsPanelFolder;
      name: string;
      isFolder: boolean;
      isOpen: boolean;
      isSelected: boolean;
      isPage: boolean;
      isCloudFunction: boolean;
      isRoot: boolean;
      isVisual: boolean;
      isComponentFolder: boolean;
      canBecomeRoot: boolean;
      hasWarnings: boolean;
    };
  };

  nodeGraphEditor: TSFixme;
  disposed: boolean;
  projectFolder: ComponentsPanelFolder;
  currentSheet: TSFixme;
  currentSheetName: TSFixme;
  sheetSelectorOpen: boolean;
  selectedScope: TSFixme;
  dropTarget: TSFixme;
  renderScheduled: TSFixme;

  protected showSheetList = false;
  protected componentTitle = 'Components';

  private _lockCurrentSheetName: string = undefined;
  private _hideSheets: string[] = [];

  constructor(args: ComponentsPanelOptions) {
    super();

    this.parent = args.parent;
    this.model = args.model;
    this.showSheetList = args.showSheetList;
    this._lockCurrentSheetName = args.lockCurrentSheetName;
    this.currentSheetName = this._lockCurrentSheetName;
    if (args.hideSheets) this._hideSheets = args.hideSheets;
    if (args.componentTitle) this.componentTitle = args.componentTitle;

    this.componentScopes = {}; // A place to store component scopes (view models) so we can find them later by component name
    this.folderScopes = {};
  }

  private getRuntimeType() {
    if (this._lockCurrentSheetName === '__cloud__') {
      return 'cloud';
    }

    const currentSheetName = this.currentSheet.name;
    return currentSheetName === '#__cloud__' ? 'cloud' : 'browser';
  }

  setNodeGraphEditor(nodeGraphEditor: NodeGraphEditor) {
    if (this.nodeGraphEditor === nodeGraphEditor) {
      return;
    }

    if (this.nodeGraphEditor) {
      this.nodeGraphEditor.off(this);
    }

    this.nodeGraphEditor = nodeGraphEditor;

    const activeComponent = nodeGraphEditor.getActiveComponent();
    if (activeComponent) {
      this.selectComponent(activeComponent);
    }

    // When the active component is changed, update UI
    this.nodeGraphEditor?.on(
      'activeComponentChanged',
      (args) => {
        const dontSelectSheet = args.args && args.args.selectSheet === false;
        this.selectComponent(args.model, { selectSheet: !dontSelectSheet });
      },
      this
    );
  }

  dispose() {
    ProjectModel.instance?.off(this);
    this.nodeGraphEditor?.off(this);
    WarningsModel.instance.off(this);
    EventDispatcher.instance.off(this);
    NodeLibrary.instance.off(this);
    this.disposed = true;
  }

  render() {
    this.el = this.bindView($(ComponentsPanelTemplate), this);

    this.projectFolder = this.getFolderStructure();
    this.bindModels();

    if (this._lockCurrentSheetName) {
      // Lock to a specific sheet
      this.currentSheet = this.projectFolder.folders.find((x) => x.name === '#' + this._lockCurrentSheetName);
      this.currentSheetName = this._lockCurrentSheetName;
    } else {
      // Get the sheet of the current selected component
      const c = this.nodeGraphEditor?.getActiveComponent();
      if (c !== undefined) {
        const newActiveSheet = this.getSheetForComponentWithName(c.fullName);

        // Only allow selecting if the sheet is visible
        const hiddenPrefix = this._hideSheets.map((x) => '#' + x);
        if (!hiddenPrefix.some((x) => newActiveSheet.name.startsWith(x))) {
          this.currentSheet = newActiveSheet;
          this.currentSheetName = newActiveSheet === this.projectFolder ? 'Default' : newActiveSheet.name.substring(1);
        }
      }

      if (!this.currentSheet) {
        this.currentSheet = this.projectFolder;
        this.currentSheetName = 'Default';
      }
    }

    this.sheetSelectorOpen = true;
    this.renderSheets();

    this.renderComponents();

    this.makeTopLevelFolderAreaDroppable();

    this.parent && this.parent.append(this.el);

    const comp = this.nodeGraphEditor?.getActiveComponent();
    if (comp) {
      this.selectComponent(comp);
    }

    return this.el;
  }

  makeTopLevelFolderAreaDroppable() {
    this.$('.top-folder-drop-target').on('mouseover', function (e) {
      if (PopupLayer.instance.isDragging()) {
        PopupLayer.instance.indicateDropType('move');
      }
    });
    this.$('.top-folder-drop-target').on('mouseout', function (e) {
      PopupLayer.instance.indicateDropType('none');
    });
    this.$('.top-folder-drop-target').on('mouseup', (e) => {
      const dragItem = PopupLayer.instance.dragItem;

      if (dragItem) {
        this.dropOn({
          type: dragItem.type,
          component: dragItem.component,
          folder: dragItem.folder,
          targetFolder: this.currentSheet
        });

        this.scheduleRender();
        PopupLayer.instance.dragCompleted();
      }
    });
  }

  resize(layout) {
    this.el.css({
      position: 'absolute',
      left: layout.x,
      top: layout.y,
      width: layout.width,
      height: layout.height
    });
  }

  bindProjectModel() {
    const _this = this;

    // When a component is added, remove it from the folder structure
    ProjectModel.instance.on(
      'componentAdded',
      function (args) {
        _this.addComponentToFolderStructure(args.model);
        _this.scheduleRender();
      },
      _this
    );

    // When a component is removed, remove it from the folder structure
    ProjectModel.instance.on(
      'componentRemoved',
      function (args) {
        const folder = _this.getFolderForComponentWithName(args.model.name);
        if (folder) {
          folder.removeComponent(args.model);

          if (folder.folders.length === 0 && folder.components.length === 0 && folder.component) {
            // This is an empty "folder component", revert to regular component
            const parentFolder = folder.parent;
            parentFolder.removeFolder(folder);
            parentFolder.addComponent(folder.component);
          }
        }

        _this.scheduleRender();
      },
      _this
    );

    // When a component is renamed
    ProjectModel.instance.on(
      'componentRenamed',
      function (args) {
        const oldFolder = _this.getFolderForComponentWithName(args.oldName);
        if (oldFolder) {
          oldFolder.removeComponent(args.model);

          if (oldFolder.folders.length === 0 && oldFolder.components.length === 0 && oldFolder.component) {
            // This is an empty "folder component", revert to regular component
            const parentFolder = oldFolder.parent;
            parentFolder.removeFolder(oldFolder);
            parentFolder.addComponent(oldFolder.component);
          }
        }

        _this.addComponentToFolderStructure(args.model);
        _this.scheduleRender();
      },
      _this
    );

    // Project root is changed, indicate which component that now contain the
    // node
    ProjectModel.instance.on(
      'rootNodeChanged',
      function (args) {
        _this.resetIsRoot();

        if (!args.model || !args.model.owner) return;
        const component = args.model.owner.owner;

        const scope = _this.componentScopes[component.fullName];
        if (scope) scope.isRoot = true;

        // TODO: Is Folder Component?
      },
      _this
    );
  }

  private resetIsRoot() {
    _.each(this.componentScopes, function (s) {
      s.isRoot = false;
    });
    _.each(this.folderScopes, function (s) {
      s.isRoot = false;
    });
  }

  bindModels() {
    const _this = this;

    this.bindProjectModel();

    // Rerender if warnings changed
    WarningsModel.instance.on(
      'warningsChanged',
      function () {
        _.each(_this.componentScopes, function (s) {
          s.hasWarnings = WarningsModel.instance.hasComponentWarnings(s.comp, { levels: ['warning', 'error'] });
        });

        _.each(_this.folderScopes, function (s) {
          if (s.isComponentFolder) {
            s.hasWarnings = WarningsModel.instance.hasComponentWarnings(s.folder.component, {
              levels: ['warning', 'error']
            });
          }
        });
      },
      _this
    );

    EventDispatcher.instance.on(
      ['Model.nodeAdded', 'Model.nodeRemoved'],
      function (e) {
        // This could change the component allowExport
        const component = e.args.model.owner.owner;
        if (!component) return;

        const scope = _this.componentScopes[component.fullName];
        if (scope) {
          scope.canBecomeRoot = scope.comp.allowAsExportRoot;
          _this.scheduleRender();
        }
      },
      _this
    );

    NodeLibrary.instance.on(
      'libraryUpdated',
      function () {
        _.each(_this.componentScopes, function (s) {
          s.canBecomeRoot = s.comp.allowAsExportRoot;
        });
        _this.scheduleRender();
      },
      _this
    );

    EventDispatcher.instance.on(
      'ProjectModel.instanceHasChanged',
      (args) => {
        // New project loaded
        if (args.oldInstance) {
          args.oldInstance.off(this);
        }
        if (ProjectModel.instance === undefined) return;

        _this.bindProjectModel();
        _this.projectFolder = _this.getFolderStructure(); // Recreate folder structure
        if (_this._lockCurrentSheetName) {
          _this.currentSheet = _this.projectFolder.folders.find((x) => x.name === '#' + this._lockCurrentSheetName);
        }

        _this.scheduleRender();
        if (_this.selectedScope && _this.selectedScope.comp) {
          // If there was a previously selected component, and it's still valid, push it to the node graph editor
          //otherwise, go to the homeroot component
          let comp = ProjectModel.instance.getComponentWithName(_this.selectedScope.comp.fullName);

          if (!comp) {
            comp = ProjectModel.instance.getRootComponent();
          }

          this.nodeGraphEditor.switchToComponent(comp);
        }
      },
      this
    );
  }

  selectComponent(component: ComponentModel, args?) {
    if (this.selectedScope) this.selectedScope.isSelected = false;

    //don't select component from hidden sheets
    const hiddenPrefix = this._hideSheets.map((x) => '/#' + x);
    if (hiddenPrefix.some((x) => component.name.startsWith(x))) {
      return;
    }

    // Select the component
    const fullName = component.fullName;
    const scope = this.componentScopes[fullName];

    if (scope) {
      //Check if this is a "folder component". In that case, select the folder scope instead of the component scope.
      const folderScope = this.folderScopes[fullName + '/'];
      if (folderScope) {
        folderScope.isSelected = true;
        this.selectedScope = folderScope;
      } else {
        scope.isSelected = true;
        this.selectedScope = scope;
      }
    }

    // Select the sheet
    if (!args || args.selectSheet !== false) {
      this.selectSheet(this.getSheetForComponentWithName(component.fullName));
    }

    this.openAllFolderToPath(fullName);
  }

  openAllFolderToPath(fullName: string) {
    for (const path in this.folderScopes) {
      if (fullName.indexOf(path) === 0) {
        this.folderScopes[path].isOpen = true;
        this.folderScopes[path].folder.isOpen = true;
      }
    }
  }

  makeDraggable(el, type, args) {
    let mouseDownOnItem = false;

    el.find('.drag-handle').on('mousedown', function (e) {
      mouseDownOnItem = true;
    });
    el.find('.drag-handle').on('mouseup', function (e) {
      mouseDownOnItem = false;
    });
    el.find('.drag-handle').on('mousemove', function (e) {
      if (mouseDownOnItem) {
        PopupLayer.instance.startDragging({
          label: type === 'component' ? args.component.localName : args.folder.name,
          type: type,
          component: args.component,
          folder: args.folder
        });
        mouseDownOnItem = false;
      }
    });
  }

  getAcceptableDropType(args) {
    const folder = args.folder; // source folder
    const component = args.component;
    const type = args.type;
    const targetFolder = args.targetFolder;
    const targetComponent = args.targetComponent;

    if (targetFolder) {
      // Can we drop of this folder?

      if (type === 'component' && folder !== targetFolder && !targetFolder.hasComponentWithName(component.localName))
        return 'component';
      else if (
        type === 'folder' &&
        folder !== targetFolder &&
        !folder.isAncestorTo(targetFolder) &&
        !targetFolder.hasFolderWithName(folder.name)
      )
        return 'folder';
    } else if (targetComponent) {
      // Can we drop on this component?

      if (type === 'component') {
        if (component === targetComponent) return false; // Cannot drop on oneself
        return 'component';
      } else if (type === 'folder') {
        return 'folder';
      }
    }

    return false;
  }

  dropOn(args) {
    const _this = this;
    const targetFolder = args.targetFolder;
    const targetComponent = args.targetComponent;
    const folder = args.folder; // source folder
    const component = args.component;
    const dropType = this.getAcceptableDropType(args);

    if (targetFolder) {
      // We are dropping on a folder

      // Move component into folder
      if (dropType === 'component') {
        const oldPath = folder.getPath();
        const newPath = targetFolder.getPath();

        UndoQueue.instance.pushAndDo(
          new UndoActionGroup({
            label: 'move component to folder',
            do: function () {
              ProjectModel.instance.renameComponent(component, newPath + component.localName);
            },
            undo: function () {
              ProjectModel.instance.renameComponent(component, oldPath + component.localName);
            }
          })
        );
      }
      // Move folder into folder
      else if (dropType === 'folder') {
        const newPath = targetFolder.getPath() + folder.name + '/';
        const oldPath = folder.getPath();
        const folderComponent = folder.component;

        UndoQueue.instance.pushAndDo(
          new UndoActionGroup({
            label: 'move folder to folder',
            do: function () {
              const comps = ProjectModel.instance.getComponentsWithPath(oldPath);
              _.each(comps, function (c) {
                const componentPathInFolder = c.name.substring(oldPath.length);
                ProjectModel.instance.renameComponent(c, newPath + componentPathInFolder);
              });
              if (folderComponent) {
                ProjectModel.instance.renameComponent(folderComponent, newPath.slice(0, -1)); // Remove trailing slash
              } else {
                folder.parent?.removeFolder(folder); //folder has been moved and is now empty, remove it
              }

              _this.scheduleRender();
            },
            undo: function () {
              const comps = ProjectModel.instance.getComponentsWithPath(newPath);
              _.each(comps, function (c) {
                const componentPathInFolder = c.name.substring(newPath.length);
                ProjectModel.instance.renameComponent(c, oldPath + componentPathInFolder);
              });
              if (folderComponent) ProjectModel.instance.renameComponent(folderComponent, oldPath.slice(0, -1)); // Remove trailing slash

              _this.scheduleRender();
            }
          })
        );
      }
    } else if (targetComponent) {
      // We are dropping on a component

      // Move component as a subcomponent
      if (dropType === 'component') {
        var oldPath = folder.getPath();
        var newPath = targetComponent.fullName + '/';

        UndoQueue.instance.pushAndDo(
          new UndoActionGroup({
            label: 'move component into component',
            do: function () {
              ProjectModel.instance.renameComponent(component, newPath + component.localName);
            },
            undo: function () {
              ProjectModel.instance.renameComponent(component, oldPath + component.localName);
            }
          })
        );
      }
      // Move folder into component
      else if (dropType === 'folder') {
        var newPath = targetComponent.fullName + '/' + folder.name + '/';
        var oldPath = folder.getPath();
        const folderComponent = folder.component;

        UndoQueue.instance.pushAndDo(
          new UndoActionGroup({
            label: 'move folder into component',
            do: function () {
              const comps = ProjectModel.instance.getComponentsWithPath(oldPath);
              _.each(comps, function (c) {
                const componentPathInFolder = c.name.substring(oldPath.length);
                ProjectModel.instance.renameComponent(c, newPath + componentPathInFolder);
              });
              if (folderComponent) ProjectModel.instance.renameComponent(folderComponent, newPath.slice(0, -1)); // Remove trailing slash

              _this.scheduleRender();
            },
            undo: function () {
              const comps = ProjectModel.instance.getComponentsWithPath(newPath);
              _.each(comps, function (c) {
                const componentPathInFolder = c.name.substring(newPath.length);
                ProjectModel.instance.renameComponent(c, oldPath + componentPathInFolder);
              });
              if (folderComponent) ProjectModel.instance.renameComponent(folderComponent, oldPath.slice(0, -1)); // Remove trailing slash

              _this.scheduleRender();
            }
          })
        );
      }
    }
  }

  makeDroppable(el, args) {
    const _this = this;
    const _dropTarget = args.folder || args.component;

    el.find('.drop-target').on('mouseover', function (e) {
      if (PopupLayer.instance.isDragging()) {
        const dragItem = PopupLayer.instance.dragItem;
        const dropType = _this.getAcceptableDropType({
          type: dragItem.type,
          folder: dragItem.folder,
          component: dragItem.component,
          targetFolder: args.folder,
          targetComponent: args.component
        });
        if (dropType) {
          _this.dropTarget = _dropTarget;
          PopupLayer.instance.indicateDropType('move');
        }
      }
    });
    el.find('.drop-target').on('mouseout', function (e) {
      if (_this.dropTarget === _dropTarget) {
        _this.dropTarget = undefined;
        PopupLayer.instance.indicateDropType('none');
      }
    });
    el.find('.drop-target').on('mouseup', function (e) {
      if (_this.dropTarget === _dropTarget) {
        const dragItem = PopupLayer.instance.dragItem;

        if (dragItem) {
          _this.dropOn({
            type: dragItem.type,
            component: dragItem.component,
            folder: dragItem.folder,
            targetFolder: args.folder,
            targetComponent: args.component
          });

          _this.scheduleRender();
          PopupLayer.instance.dragCompleted();
        }
      }
    });
  }

  renderFolder(folder: ComponentsPanelFolder, appendTo: TSFixme, indent: number) {
    const _indent = indent ? indent : 0;
    appendTo.html('');

    function applyIndent(el) {
      View.$(el, '.indent-me').css({ 'margin-left': _indent * 17 + 23 + 'px' });
      for (let i = 0; i < _indent; i++) {
        View.$(el, '.indent-line-container')[0].innerHTML += '<div class="indent-line"></div>';
      }
    }

    const returnComponentScopeAndSetActive = (c, f) => {
      const iconType = getComponentIconType(c);
      const scope = {
        folder: f,
        comp: c,
        name: c.localName,
        isSelected: this.nodeGraphEditor?.getActiveComponent() === c,
        isPage: iconType === ComponentIconType.Page,
        isCloudFunction: iconType === ComponentIconType.CloudFunction,
        isRoot: ProjectModel.instance.getRootNode() && ProjectModel.instance.getRootNode().owner.owner == c,
        isVisual: iconType === ComponentIconType.Visual,
        isComponentFolder: false,
        canBecomeRoot: c.allowAsExportRoot,
        hasWarnings: WarningsModel.instance.hasComponentWarnings(c)
      };

      if (this.nodeGraphEditor?.getActiveComponent() === c) this.selectedScope = scope;

      return scope;
    };

    // Render folders at the top
    for (var i in folder.folders) {
      const f = folder.folders[i];

      if (f.name[0] === '#') continue;

      const iconType = getComponentIconType(f.component);
      const scope: ComponentsPanelView['folderScopes'][0] = {
        folder: f,
        name: f.name,
        isFolder: true,
        isOpen: f.isOpen,
        isSelected: Boolean(f.component) && this.nodeGraphEditor?.getActiveComponent() === f.component,
        isPage: iconType === ComponentIconType.Page,
        isCloudFunction: iconType === ComponentIconType.CloudFunction,
        isVisual: iconType === ComponentIconType.Visual,
        isRoot:
          Boolean(f.component) &&
          ProjectModel.instance.getRootNode() &&
          ProjectModel.instance.getRootNode().owner.owner == f.component,
        isComponentFolder: Boolean(f.component),
        canBecomeRoot: Boolean(f.component) && f.component.allowAsExportRoot,
        hasWarnings: Boolean(f.component) && WarningsModel.instance.hasComponentWarnings(f.component)
      };

      this.folderScopes[f.getPath()] = scope;

      if (f.component) {
        this.componentScopes[f.component.name] = returnComponentScopeAndSetActive(f.component, f);
      }

      const fEl = this.bindView(this.cloneTemplate('folder'), scope);
      applyIndent(fEl);
      appendTo.append(fEl);

      this.makeDroppable(fEl, { folder: f });
      this.makeDraggable(fEl, 'folder', { folder: f });

      this.renderFolder(f, fEl.find('.subfolders'), _indent + 1);
    }

    // Then component items
    for (var i in folder.components) {
      const c = folder.components[i];

      const scope = returnComponentScopeAndSetActive(c, folder);

      // Store component scopes in hash so we can fetch the later using component name
      this.componentScopes[c.fullName] = scope;

      const cEl = this.bindView(this.cloneTemplate('item'), scope);
      applyIndent(cEl);
      appendTo.append(cEl);

      // Components should be draggable
      this.makeDroppable(cEl, { component: c });
      this.makeDraggable(cEl, 'component', { component: c, folder: folder });
    }
  }

  scheduleRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;

    setTimeout(() => {
      this.renderScheduled = false;

      if (this.disposed) {
        return;
      }

      this.renderSheets();
      this.renderComponents();
    }, 1);
  }

  renderComponents() {
    this.$('.components').html('');

    //this.makeDroppable(this.$('.components-project-drop-target'), this.projectFolder);

    if (this.currentSheet !== undefined) {
      this.renderFolder(this.currentSheet, this.$('.components'), 0);
    }
  }

  onAddSheetClicked() {
    const sheet = new ComponentsPanelFolder({
      name: '#New sheet',
      folders: [],
      components: []
    });
    UndoQueue.instance.pushAndDo(
      new UndoActionGroup({
        label: 'new sheet',
        do: () => {
          this.projectFolder.addFolder(sheet);

          // Create new sheet and add
          const scope = {
            name: 'New sheet',
            folder: sheet,
            isFolder: true
          };
          const el = this.renderSheetItem(scope);
          this.$('.sheets').append(el);

          this.onRenameClicked(scope, el.find('.components-panel-item-dropdown'), '#');
        },
        undo: () => {
          this.projectFolder.removeFolder(sheet);

          this.renderSheets();
        }
      })
    );
  }

  selectSheet(sheet: ComponentsPanelFolder) {
    if (this.currentSheet === sheet) return;

    // Dont allow to change sheet when locked
    if (this._lockCurrentSheetName) return;

    // Dont allow to select hidden sheets
    if (this._hideSheets.includes(sheet.name)) {
      return;
    }

    this.currentSheet = sheet;
    this.currentSheetName = sheet === this.projectFolder ? 'Default' : sheet.name.substring(1);

    this.renderComponents();
    this.renderSheets();
  }

  onSheetClicked(scope, el, evt) {
    this.selectSheet(scope.folder);
  }

  renderSheetItem(scope) {
    const el = this.bindView(this.cloneTemplate('sheet-item'), scope);
    const input = el.find('.name-edit');

    this.makeDroppable(el, { folder: scope.folder });

    return el;
  }

  renderSheets() {
    // Sheets are simply to level folders starting with #, everything else will end up under the Default sheet
    this.$('.sheets').html('');
    const sheets: SheetType[] = [
      { name: 'Default', folder: this.projectFolder, isFolder: true, isDefault: true }
    ].concat(
      this.projectFolder.folders
        .filter((f) => f.name[0] === '#')
        .map((f) => {
          return { name: f.name.substring(1), folder: f, isFolder: true, isDefault: false };
        })
    );

    sheets
      // Hide all the sheets we dont want to show
      .filter((x) => !this._hideSheets.includes(x.name))
      .forEach((s) => {
        s.isSelected = s.folder === this.currentSheet;
        this.$('.sheets').append(this.renderSheetItem(s));
      });
  }

  onSheetSelectorClicked() {
    this.sheetSelectorOpen = !this.sheetSelectorOpen;
  }

  onItemEyeClicked(scope, el, evt) {
    // Clicked on component, switch to component
    if (scope.comp.allowAsExportRoot) {
      this.resetIsRoot();

      ProjectModel.instance.setRootComponent(scope.comp);
      scope.isRoot = true;
    }
  }

  onItemClicked(scope, el, evt) {
    // Clicked on component, switch to component
    if (!scope.isFolder) {
      this.nodeGraphEditor.switchToComponent(scope.comp, { pushHistory: true });
    }
    // Clicked on folder, switch to folder
    else {
      if (scope.folder.component) {
        // This folder is a "folder component"
        this.nodeGraphEditor.switchToComponent(scope.folder.component, { pushHistory: true });
      } else {
        scope.folder.isOpen = scope.isOpen = !scope.isOpen;
      }
    }
  }

  onCaretClicked(scope, el, evt) {
    scope.folder.isOpen = scope.isOpen = !scope.isOpen;
    evt.stopPropagation();
  }

  onSheetActionsClicked(scope, el, evt) {
    const _this = this;

    const menu = new NewPopupLayer.PopupMenu({
      items: [
        {
          icon: IconName.Pencil,
          label: 'Rename',
          onClick: function () {
            _this.onRenameClicked(scope, el, '#');
            evt.stopPropagation();
          }
        },
        {
          label: 'Delete',
          icon: IconName.Trash,
          onClick: function () {
            _this.onDeleteClicked(scope, el);
            evt.stopPropagation();
          }
        }
      ]
    });
    menu.render();

    PopupLayer.instance.showPopup({
      content: menu,
      attachTo: el,
      position: 'right',
      onOpen: function () {
        el.removeClass('components-panel-item-show-on-hover');
      },
      onClose: function () {
        el.addClass('components-panel-item-show-on-hover');
      }
    });

    evt.stopPropagation();
  }

  onComponentActionsClicked(scope, el, evt) {
    const _this = this;

    const templates = ComponentTemplates.instance.getTemplates({
      forParentType: 'component',
      forRuntimeType: this.getRuntimeType()
    });

    let items: PopupMenuItem[] = templates.map((t) => ({
      icon: IconName.Plus,
      label: t.label,
      onClick: () => {
        this.onAddComponentWithTemplateClicked(Object.assign(scope, { template: t }), el);
        evt.stopPropagation();
      }
    }));

    items.push({ type: 'divider' });

    if (scope.comp.allowAsExportRoot) {
      items.push({
        icon: IconName.Home,
        label: 'Make home',
        onClick: () => {
          _this.resetIsRoot();

          ProjectModel.instance.setRootComponent(scope.comp);
          scope.isRoot = true;

          evt.stopPropagation();
        }
      });
    }

    // Find references
    const nodeReference = HACK_findNodeReference(scope.comp.name);
    const nodeReferencesText = `Used in ~${nodeReference?.referenaces?.length || 0} places`;

    items = items.concat([
      {
        icon: IconName.Pencil,
        label: 'Rename',
        onClick: function () {
          _this.onRenameClicked(scope, el);
          evt.stopPropagation();
        }
      },
      {
        icon: IconName.Cards,
        label: 'Duplicate',
        onClick: function () {
          _this.onDuplicateClicked(scope, el);
          evt.stopPropagation();
        }
      },
      {
        icon: IconName.Trash,
        label: 'Delete',
        onClick: function () {
          _this.onDeleteClicked(scope, el);
          evt.stopPropagation();
        }
      },
      {
        label: nodeReferencesText
      }
    ]);

    const menu = new NewPopupLayer.PopupMenu({
      items: items
    });
    menu.render();

    PopupLayer.instance.showPopup({
      content: menu,
      attachTo: el,
      position: 'bottom',
      onOpen: function () {
        el.removeClass('sidebar-panel-item-show-on-hover');
        el.addClass('is-active');
      },
      onClose: function () {
        el.addClass('sidebar-panel-item-show-on-hover');
        el.removeClass('is-active');
      }
    });

    evt.stopPropagation();
  }

  onFolderActionsClicked(scope, el, evt) {
    const _this = this;

    const templates = ComponentTemplates.instance.getTemplates({
      forParentType: scope.folder.component ? 'component' : 'folder',
      forRuntimeType: this.getRuntimeType()
    });

    let items: TSFixme[] = templates.map((t) => ({
      icon: IconName.Plus,
      label: t.label,
      onClick: () => {
        this.onAddComponentWithTemplateClicked(Object.assign(scope, { template: t }), el);
        evt.stopPropagation();
      }
    }));

    items = items.concat([
      {
        icon: IconName.Plus,
        label: 'Folder',
        onClick: function () {
          _this.onAddFolderClicked(scope, el);
          evt.stopPropagation();
        }
      },
      {
        type: 'divider'
      }
    ]);

    if (scope.canBecomeRoot) {
      items.push({
        icon: IconName.Home,
        label: 'Make home',
        onClick: () => {
          this.resetIsRoot();

          ProjectModel.instance.setRootComponent(scope.folder.component);
          scope.isRoot = true;

          evt.stopPropagation();
        }
      });
    }

    // Default items for folders
    items = items.concat([
      {
        icon: IconName.Pencil,
        label: 'Rename',
        onClick: function () {
          _this.onRenameClicked(scope, el);
          evt.stopPropagation();
        }
      },
      {
        icon: IconName.Cards,
        label: 'Duplicate',
        onClick: function () {
          _this.onDuplicateFolderClicked(scope, el);
          evt.stopPropagation();
        }
      },
      {
        icon: IconName.Trash,
        label: 'Delete',
        onClick: function () {
          _this.onDeleteClicked(scope, el);
          evt.stopPropagation();
        }
      }
    ]);

    if (scope.canBecomeRoot) {
      // Find references
      const nodeReference = HACK_findNodeReference(scope.folder.component.name);
      const nodeReferencesText = `Used in ~${nodeReference?.referenaces?.length || 0} places`;

      items = items.concat([{
        label: nodeReferencesText
      }]);
    }

    const menu = new NewPopupLayer.PopupMenu({
      items: items
    });
    menu.render();

    PopupLayer.instance.showPopup({
      content: menu,
      attachTo: el,
      position: 'bottom',
      onOpen: function () {
        el.removeClass('sidebar-panel-item-show-on-hover');
      },
      onClose: function () {
        el.addClass('sidebar-panel-item-show-on-hover');
      }
    });

    evt.stopPropagation();
  }

  onAddComponentWithTemplateClicked(scope, el, evt?) {
    const _this = this;

    const popup = scope.template.createPopup({
      onCreate: (localName, options) => {
        const parentPath = scope.comp
          ? scope.comp.fullName + '/'
          : scope.folder
          ? scope.folder.getPath()
          : _this.currentSheet.getPath();

        const result = _this.performAdd({
          type: 'component',
          template: scope.template,
          parentPath: parentPath,
          name: localName,
          templateOptions: options
        });
        if (!result.success) ToastLayer.showError(result.message);
      },
      onCancel: () => {
        PopupLayer.instance.hidePopup();
      }
    });

    // Find where to attach the popup
    const attachPopupTo = el.filter('.attach-popup-here').add(el.parents('.attach-popup-here'));
    const position = el.attr('data-popup-position');

    PopupLayer.instance.showPopup({
      content: popup,
      attachTo: attachPopupTo,
      position: position ? position : 'bottom'
    });

    evt && evt.stopPropagation();
  }

  onAddComponentClicked(scope, el, evt) {
    const _this = this;

    const templates = ComponentTemplates.instance.getTemplates({
      forRuntimeType: this.getRuntimeType()
    });

    const items = templates.map((t) => ({
      icon: t.icon,
      label: t.label,
      onClick: () => {
        this.onAddComponentWithTemplateClicked(Object.assign(scope, { template: t }), el);
        evt.stopPropagation();
      }
    }));

    items.push({
      icon: IconName.FolderClosed,
      label: 'Folder',
      onClick: function () {
        _this.onAddFolderClicked(scope, el);
        evt.stopPropagation();
      }
    });

    const menu = new NewPopupLayer.PopupMenu({
      items: items
    });
    menu.render();

    PopupLayer.instance.showPopup({
      content: menu,
      attachTo: el,
      position: 'bottom',
      onOpen: function () {
        el.removeClass('sidebar-panel-item-show-on-hover');
      },
      onClose: function () {
        el.addClass('sidebar-panel-item-show-on-hover');
      }
    });

    evt && evt.stopPropagation();
  }

  onAddFolderClicked(scope, el, evt?) {
    const _this = this;

    const popup = new PopupLayer.StringInputPopup({
      label: 'New folder name',
      okLabel: 'Add',
      cancelLabel: 'Cancel',
      onOk: function (folderName) {
        const result = _this.performAdd({
          type: 'folder',
          parentFolder: scope.folder ? scope.folder : _this.currentSheet,
          name: folderName
        });
        if (!result.success) ToastLayer.showError(result.message);
      }
    });
    popup.render();

    // Find where to attach popup
    const attachPopupTo = el.filter('.attach-popup-here').add(el.parents('.attach-popup-here'));
    const position = el.attr('data-popup-position');

    PopupLayer.instance.showPopup({
      content: popup,
      attachTo: attachPopupTo,
      position: position ? position : 'bottom'
    });

    evt && evt.stopPropagation();
  }

  performAdd(args) {
    const _this = this;
    let component = null;

    // Add a new component in the current folder
    if (args.type === 'component') {
      const componentName = args.parentPath + args.name;

      if (args.name === undefined || args.name === '') {
        return { success: false, message: 'Component name cannot be empty' };
      } else if (ProjectModel.instance.getComponentWithName(componentName)) {
        return { success: false, message: 'Component name already exists. Name must be unique.' };
      } else {
        const undoGroup = new UndoActionGroup({ label: 'add component' });

        if (args.template !== undefined) {
          component = args.template.createComponent(componentName, args.templateOptions, undoGroup);
        } else {
          component = new ComponentModel({
            name: componentName,
            graph: new NodeGraphModel(),
            id: guid()
          });
        }

        tracker.track('Component Created', {
          template: args.template ? args.template.label : undefined
        });

        ProjectModel.instance.addComponent(component, { undo: undoGroup });
        UndoQueue.instance.push(undoGroup);

        this.nodeGraphEditor.switchToComponent(component, { pushHistory: true });
      }
    }
    // Add a new folder
    else if (args.type === 'folder') {
      const folderName = args.name;
      const parentFolder = args.parentFolder ? args.parentFolder : this.currentSheet;
      if (folderName === undefined || folderName === '') {
        return { success: false, message: 'Folder name cannot be empty' };
      } else if (parentFolder.hasFolderWithName(folderName)) {
        return { success: false, message: 'Folder name already exists. Name must be unique.' };
      } else {
        // Perform add folder and push to queue
        const folder = new ComponentsPanelFolder({
          name: folderName,
          folders: [],
          components: []
        });

        UndoQueue.instance.pushAndDo(
          new UndoActionGroup({
            label: 'add folder',
            do: function () {
              parentFolder.addFolder(folder);
              _this.scheduleRender();
            },
            undo: function () {
              parentFolder.removeFolder(folder);
              _this.scheduleRender();
            }
          })
        );
      }
    }

    return { success: true };
  }

  performRename(args) {
    const _this = this;

    // Rename component if possible
    if (args.type === 'component') {
      var oldName = args.component.name;
      var newName = args.folder.getPath() + args.name;

      if (!ProjectModel.instance.renameComponentAllowed(args.component.fullName)) {
        return { success: false, message: 'This component cannot be renamed' };
      } else if (args.name === undefined || args.name === '') {
        return { success: false, message: 'Component name cannot be empty' };
      } else if (ProjectModel.instance.getComponentWithName(newName)) {
        return { success: false, message: 'Rename a component to the same name as an existing one.' };
      } else {
        ProjectModel.instance.renameComponentWithName(oldName, newName, { undo: true, label: 'rename component' });
      }
    }
    // Rename folder
    else if (args.type === 'folder') {
      if (args.name === undefined || args.name === '') {
        return { success: false, message: 'Folder name cannot be empty' };
      } else if (args.folder.parent.hasFolderWithName(args.name, { excludeFolders: [args.folder] })) {
        return { success: false, message: 'Folder name already exist' };
      } else {
        // Rename folder, and rename all components
        var oldName = args.folder.name;
        var newName = args.name;
        const folder = args.folder;
        const folderComponent = folder.component;

        UndoQueue.instance.pushAndDo(
          new UndoActionGroup({
            label: 'rename folder',
            do: function () {
              const oldPath = folder.getPath();
              folder.name = newName;
              const newPath = folder.getPath();
              ProjectModel.instance.moveComponentsToNewPath(oldPath, newPath);
              if (folderComponent) ProjectModel.instance.renameComponent(folderComponent, newPath.slice(0, -1)); // Remove trailing /
              _this.scheduleRender();
            },
            undo: function () {
              const oldPath = folder.getPath();
              folder.name = oldName;
              const newPath = folder.getPath();
              if (folderComponent) ProjectModel.instance.renameComponent(folderComponent, newPath.slice(0, -1)); // Remove trailing /
              ProjectModel.instance.moveComponentsToNewPath(oldPath, newPath);
              _this.scheduleRender();
            }
          })
        );
      }
    }

    return { success: true };
  }

  onRenameClicked(scope, el, prefix?) {
    const _this = this;

    el.parent().find('.item-mode-edit').show();
    el.parent().find('.item-mode-default').hide();

    const input = el.parent().find('input');
    input.val(scope.name);

    function rename() {
      if (scope.name !== input.val()) {
        let type = 'component';
        if (scope.isFolder) type = 'folder';

        const result = _this.performRename({
          type: type,
          name: (prefix !== undefined ? prefix : '') + input.val(),
          component: scope.comp,
          folder: scope.folder
        });
        if (!result.success) {
          ToastLayer.showError(result.message);
        } else {
          scope.name = input.val();
        }
      }

      el.parent().find('.item-mode-edit').hide();
      el.parent().find('.item-mode-default').show();
    }

    input
      .off('click')
      .on('click', (e) => {
        e.stopPropagation();
      })
      .off('keypress')
      .on('keypress', function (e) {
        if (e.which == 13) rename();
      })
      .focus()
      .off('blur')
      .on('blur', function () {
        rename();
      });
  }

  performDelete(args): ActionResult {
    const _this = this;

    // Delete component
    if (args.type === 'component') {
      const result = ProjectModel.instance.deleteComponentAllowed(args.component);
      if (result.canBeDelete === false) {
        return { success: false, message: result.reason };
      } else {
        ProjectModel.instance.removeComponent(args.component, { undo: true, label: 'delete component' });
      }
    }
    // Delete folder
    else if (args.type === 'folder') {
      const folder = args.folder;
      const parentFolder = folder.parent;
      const componentsToDelete = ProjectModel.instance.getComponentsWithPath(folder.getPath());
      const folderComponent = folder.component;

      UndoQueue.instance.pushAndDo(
        new UndoActionGroup({
          label: 'delete folder',
          do: function () {
            parentFolder.removeFolder(args.folder);
            if (args.folder === _this.currentSheet) {
              _this.currentSheet = _this.projectFolder;
            }

            _.each(componentsToDelete, function (c) {
              ProjectModel.instance.removeComponent(c);
            });
            if (folderComponent) ProjectModel.instance.removeComponent(folderComponent);

            _this.scheduleRender();
          },
          undo: function () {
            parentFolder.addFolder(args.folder);

            _.each(componentsToDelete, function (c) {
              ProjectModel.instance.addComponent(c);
            });
            if (folderComponent) ProjectModel.instance.addComponent(folderComponent);

            _this.scheduleRender();
          }
        })
      );
    }

    return { success: true };
  }

  performDuplicate(args): ActionResult {
    if (args.component) {
      // Find component name
      var cnt = 2;
      let newComponentName = args.component.fullName + ' copy';
      while (ProjectModel.instance.getComponentWithName(newComponentName) !== undefined) {
        newComponentName = args.component.fullName + ' copy ' + cnt;
        cnt++;
      }

      ProjectModel.instance.duplicateComponent(args.component, newComponentName, { undo: true });

      return { success: true };
    } else if (args.folder) {
      const oldFolderName = args.folder.getPath();

      var cnt = 2;
      let newFolderName = oldFolderName.slice(0, -1) + ' copy' + '/';
      while (ProjectModel.instance.getComponentsWithPath(newFolderName).length > 0) {
        newFolderName = oldFolderName.slice(0, -1) + ' copy ' + cnt + '/';
        cnt++;
      }

      const comps = args.folder.components;
      const folderComponent = args.folder.component;

      UndoQueue.instance.pushAndDo(
        new UndoActionGroup({
          label: 'duplicate folder or component',
          do: () => {
            comps.forEach((c) => {
              ProjectModel.instance.duplicateComponent(c, newFolderName + c.localName, {
                rerouteComponentRefs: {
                  oldPathPrefix: oldFolderName,
                  newPathPrefix: newFolderName
                }
              });
            });
            if (folderComponent)
              ProjectModel.instance.duplicateComponent(folderComponent, newFolderName.slice(0, -1), {
                rerouteComponentRefs: {
                  oldPathPrefix: oldFolderName,
                  newPathPrefix: newFolderName
                }
              });
          },
          undo: () => {
            comps.forEach((c) => {
              ProjectModel.instance.removeComponent(
                ProjectModel.instance.getComponentWithName(newFolderName + c.localName)
              );
            });
            if (folderComponent)
              ProjectModel.instance.removeComponent(
                ProjectModel.instance.getComponentWithName(newFolderName.slice(0, -1))
              );
          }
        })
      );

      return { success: true };
    }
  }

  onDuplicateClicked(scope, el) {
    if (scope.isFolder) return;

    const result = this.performDuplicate({
      component: scope.comp
    });

    if (!result.success) {
      ToastLayer.showError(result.message);
    }
  }

  onDuplicateFolderClicked(scope, el) {
    const result = this.performDuplicate({
      folder: scope.folder
    });

    if (!result.success) {
      ToastLayer.showError(result.message);
    }
  }

  onDeleteClicked(scope, el) {
    let type = 'component';
    if (scope.isFolder) type = 'folder';

    const result = this.performDelete({
      type: type,
      component: scope.comp,
      folder: scope.folder
    });

    if (!result.success) {
      ToastLayer.showError(result.message);
    } else {
      // Go to the current component in history
      // (if the selected was deleted, then the new one is the previous one)
      const navigateResult = this.nodeGraphEditor.navigationHistory.goToCurrent();
      if (!navigateResult) {
        // Otherwise go back to the default component
        const component = getDefaultComponent();
        this.nodeGraphEditor.switchToComponent(component, { pushHistory: true });
      }
    }
  }

  addComponentToFolderStructure(c, root?) {
    function addToFolder(folder: ComponentsPanelFolder, path: string, component: ComponentModel) {
      let f: ComponentsPanelFolder = null;

      if (path.length === 1) {
        // Check if there already is a folder with the component name,
        // in that case make this component the folder component instead
        const folderComponent = folder.folders.find((f) => f.name === component.localName);
        if (folderComponent) folderComponent.component = component;
        else folder.addComponent(component);
      } else {
        const folderName = path[0];
        for (const i in folder.folders) {
          f = folder.folders[i];
          if (f.name === folderName) {
            return addToFolder(f, path.slice(1), component);
          }
        }

        // See if there is a component with the same name as the folder already
        // in that case, set it as the folder component
        const folderComponentIdx = folder.components.findIndex((c) => c.localName === folderName);

        f = new ComponentsPanelFolder({
          name: folderName,
          component: folderComponentIdx == -1 ? undefined : folder.components[folderComponentIdx],
          folders: [],
          components: []
        });

        if (folderComponentIdx !== -1) {
          folder.components.splice(folderComponentIdx, 1);
        }

        folder.addFolder(f);
        return addToFolder(f, path.slice(1), component);
      }
    }

    let fullpath = c.fullName;
    if (fullpath[0] === '/') fullpath = fullpath.substring(1); // Ignore leading '/'
    const path = fullpath.split('/');
    addToFolder(root ? root : this.projectFolder, path, c);
  }

  getFolderStructure() {
    const root = new ComponentsPanelFolder({
      name: '',
      folders: [],
      components: []
    });

    // Add the Cloud Functions folder, it shouldn't be visible.
    root.addFolder(
      new ComponentsPanelFolder({
        name: '#__cloud__',
        folders: [],
        components: []
      })
    );

    const components = ProjectModel.instance.getComponents();
    for (const index in components) {
      const component = components[index];

      // if (ProjectModel.instance.isComponentHidden(c.fullName)) continue;

      this.addComponentToFolderStructure(component, root);
    }

    return root;
  }

  getSheetForComponentWithName(name: string) {
    // Sheet is simply to level folder
    const folders = name.split('/');
    if (folders[0] === '') folders.shift(); // Ignore leading /
    if (folders.length === 1) return this.projectFolder;

    if (folders[0][0] === '#') return this.getFolderWithPath('/' + folders[0] + '/');
    else return this.projectFolder;
  }

  getFolderForComponentWithName(name) {
    const folders = name.split('/');
    const folderpath = folders.slice(0, folders.length - 1).join('/') + '/';
    if (folderpath === '/') return this.projectFolder;
    return this.getFolderWithPath(folderpath);
  }

  getFolderWithPath(path: string, folder?) {
    const _folder = folder ? folder : this.projectFolder;
    if (path === '/') return _folder;

    for (const i in _folder.folders) {
      const f = _folder.folders[i];

      if (f.getPath() === path) return f;
      const subfolder = this.getFolderWithPath(path, f);
      if (subfolder) return subfolder;
    }
  }
}

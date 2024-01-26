import { platform } from '@noodl/platform';

import { addHashToUrl } from '@noodl-utils/addHashToUrl';
import FileSystem from '@noodl-utils/filesystem';
import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';
import ProjectImporter from '@noodl-utils/projectimporter';

import Model from '../../../shared/model';
import { EventDispatcher } from '../../../shared/utils/EventDispatcher';
import { ViewerConnection } from '../ViewerConnection';
import ImportPopup from '../views/importpopup';
import PopupLayer from '../views/popuplayer';
import { unzipIntoDirectory } from './projectmodel.editor';

const ImportOverwritePopupTemplate = require('../templates/importoverwritepopup.html');
export interface IModule {
  label: string;
  desc: string;
  project: string;
  icon: string;
  docs: string;
  tags: string[];
}

export class ModuleLibraryModel extends Model {
  public modules: IModule[];
  public prefabs: IModule[];

  private static _instance: ModuleLibraryModel = undefined;
  public static get instance() {
    if (!this._instance) {
      this._instance = new ModuleLibraryModel();
    }
    return this._instance;
  }

  constructor() {
    super();

    this.fetchModules('modules').then((modules) => {
      this.modules = modules;
      this.notifyListeners('libraryUpdated');
    });

    this.fetchModules('prefabs').then((prefabs) => {
      this.prefabs = prefabs;
      this.notifyListeners('libraryUpdated');
    });

    this.notifyListeners('libraryUpdated');
  }

  /**
   * Resolves with items for immidiate use, but
   * also sets them to this.modules for future use
   */
  async fetchModules(type: 'modules' | 'prefabs'): Promise<IModule[]> {
    const endpoint = getDocsEndpoint();
    const urlPath = addHashToUrl(`${endpoint}/library/${type}/index.json`);

    const response = await fetch(urlPath);
    if (response.ok) {
      return await response.json();
    } else {
      return [];
    }
  }

  async installModule(modulePath: string, onBeforePopup?: () => void, onAfterPopup?: () => void) {
    const moduleRootPath = await this.getModuleTemplateRoot(modulePath);

    const imports = await new Promise((resolve, reject) =>
      ProjectImporter.instance.listComponentsAndDependencies(moduleRootPath, resolve)
    );

    const collisions = await new Promise((resolve, reject) =>
      ProjectImporter.instance.checkForCollisions(imports, (result) =>
        result && result.message ? reject(result.message) : resolve(result)
      )
    );

    let componentsToImport = imports;

    // Show overwrite popup if collisions
    if (typeof collisions !== 'undefined') {
      componentsToImport = await this._showImportPopup({ imports, collisions, onBeforePopup, onAfterPopup });
    }

    await this._doImport(moduleRootPath, componentsToImport);
  }

  async installPrefab(modulePath: string, onBeforePopup?: () => void, onAfterPopup?: () => void) {
    const moduleRootPath = await this.getModuleTemplateRoot(modulePath);

    const imports = await new Promise<TSFixme>((resolve, reject) =>
      ProjectImporter.instance.listComponentsAndDependencies(moduleRootPath, resolve)
    );

    const collisions = await new Promise<TSFixme>((resolve, reject) =>
      ProjectImporter.instance.checkForCollisions(imports, (result) =>
        result && result.message ? reject(result.message) : resolve(result)
      )
    );

    let itemsToImport = imports;

    if (typeof collisions !== 'undefined') {
      const collisionsToImport = JSON.parse(JSON.stringify(collisions));

      //remove all collisions that aren't components since we shouldn't overwrite those
      collisionsToImport.styles = { colors: [], text: [] };
      collisionsToImport.resources = [];
      collisionsToImport.variants = [];
      collisionsToImport.modules = [];

      if (ProjectImporter.instance.hasCollisions(collisionsToImport)) {
        itemsToImport = await this._showImportPopup({
          imports,
          collisions: collisionsToImport,
          onBeforePopup,
          onAfterPopup
        });
      } else {
        //we have collisions in styles variants or resources. Let's remove those from the import
        function removeItemWithName(array, itemsToRemove) {
          for (const item of itemsToRemove) {
            array = array.filter((s) => s.name !== item.name);
          }
          return array;
        }

        itemsToImport.styles.colors = removeItemWithName(itemsToImport.styles.colors, collisions.styles.colors);
        itemsToImport.styles.text = removeItemWithName(itemsToImport.styles.text, collisions.styles.text);
        itemsToImport.variants = removeItemWithName(itemsToImport.variants, collisions.variants);
        itemsToImport.modules = removeItemWithName(itemsToImport.modules, collisions.modules);
      }
    }

    await this._doImport(moduleRootPath, itemsToImport);
  }

  async _doImport(moduleRootPath, imports) {
    ViewerConnection.instance.setWatchModelChangesEnabled(false);
    return new Promise((resolve, reject) => {
      ProjectImporter.instance.import(moduleRootPath, imports, (response) => {
        ViewerConnection.instance.setWatchModelChangesEnabled(true);

        if (response.result !== 'success') {
          reject({ message: response.message });
          PopupLayer.instance.hideAllModalsAndPopups();
        }

        EventDispatcher.instance.emit('viewer-refresh');
        EventDispatcher.instance.emit('ProjectModel.importComplete');

        resolve(true);
        PopupLayer.instance.hideAllModalsAndPopups();
      });
    });
  }

  async _showImportPopup({ imports, collisions, onBeforePopup, onAfterPopup }) {
    return new Promise((resolve, reject) => {
      const overwritePopup = new ImportPopup({
        template: ImportOverwritePopupTemplate,
        imports: collisions,
        initAllAsImport: true,
        ignoreDependencies: true,
        onOk: () => {
          onAfterPopup && onAfterPopup();
          ProjectImporter.instance.filterImports(imports, { remove: overwritePopup.getUnselectedImports() });
          resolve(imports);
        },
        onCancel: () => {
          onAfterPopup && onAfterPopup();
          PopupLayer.instance.hideModal(undefined);
          reject({ message: 'Import cancelled' });
        }
      });

      overwritePopup.render();

      onBeforePopup && onBeforePopup();

      PopupLayer.instance.showModal({
        content: overwritePopup
      });
    });
  }

  private getModuleTemplateRoot(templateUrl: string) {
    return new Promise<string>((resolve, reject) => {
      function findProjectRoot(path) {
        // Find the folder containing a project.json (it may not be the root folder)
        let root;
        FileSystem.instance.forEachFileRecursive(path, (filename, path) => {
          if (filename === 'project.json') {
            root = path;
            resolve(path);
            return;
          }
        });

        if (!root) reject({ message: 'Not a valid component' });
      }

      const name = templateUrl.replace(/:/g, '-').replace(/\//g, '-').replace('/./g', '-');
      const path = platform.getUserDataPath() + '/library/' + name;

      FileSystem.instance.makeDirectory(path, (response) => {
        if (response.result !== 'success') {
          reject({ message: 'Failed to create template directory' });
          return;
        }

        FileSystem.instance.isDirectoryEmpty(path, (isEmpty) => {
          if (isEmpty) {
            unzipIntoDirectory(
              templateUrl,
              path,
              (response) => {
                if (response.result !== 'success') {
                  reject({ message: 'Failed to download component' });
                  return;
                }

                findProjectRoot(response.dirEntry);
              },
              { skipLoad: true }
            );
          } else findProjectRoot(path);
        });
      });
    });
  }
}

import { NodeGraphContextProvider } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { NodeReferencesContextProvider } from '@noodl-contexts/NodeReferencesContext';
import { PluginContextProvider } from '@noodl-contexts/PluginContext';
import { ProjectDesignTokenContextProvider } from '@noodl-contexts/ProjectDesignTokenContext';
import { useKeyboardCommands } from '@noodl-hooks/useKeyboardCommands';
import { useModel } from '@noodl-hooks/useModel';
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import { platform } from '@noodl/platform';

import { App } from '@noodl-models/app';
import { AppRegistry } from '@noodl-models/app_registry';
import { CloudService } from '@noodl-models/CloudServices';
import { NodeLibraryImporter } from '@noodl-models/nodelibrary/NodeLibraryImporter';
import { ProjectModel } from '@noodl-models/projectmodel';
import { projectFromDirectory, unzipIntoDirectory } from '@noodl-models/projectmodel.editor';
import { SidebarModel } from '@noodl-models/sidebar';
import { SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';
import { UndoQueue } from '@noodl-models/undo-queue-model';
import { exportProjectComponents } from '@noodl-utils/exportProjectComponets';
import FileSystem from '@noodl-utils/filesystem';
import { KeyCode, KeyMod } from '@noodl-utils/keyboard/KeyCode';
import { LocalProjectsModel } from '@noodl-utils/LocalProjectsModel';
import ParseDashboardServer from '@noodl-utils/parsedashboardserver';
import ProjectImporter from '@noodl-utils/projectimporter';
import ProjectValidator from '@noodl-utils/projectvalidator';
import SchemaHandler from '@noodl-utils/schemahandler';
import { guid } from '@noodl-utils/utils';

import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';
import { ErrorBoundary } from '@noodl-core-ui/components/common/ErrorBoundary';
import { FrameDivider } from '@noodl-core-ui/components/layout/FrameDivider';

import { EventDispatcher } from '../../../../shared/utils/EventDispatcher';
import { installSidePanel, installDocuments } from '../../router.setup';
import { ViewerConnection } from '../../ViewerConnection';
import { Frame } from '../../views/common/Frame';
import ImportPopup from '../../views/importpopup';
import { LessonLayer } from '../../views/lessonlayer2';
import { NodePickerClearNews } from '../../views/NodePicker/NodePicker.hooks';
import PopupLayer from '../../views/popuplayer';
import { SidePanel } from '../../views/SidePanel';
import { ToastLayer } from '../../views/ToastLayer/ToastLayer';
import { BaseWindow } from '../../views/windows/BaseWindow';
import { whatsnewRender } from '../../whats-new';
import { IRouteProps } from '../AppRoute';
import { useSetupSettings } from './useSetupSettings';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ImportOverwritePopupTemplate = require('../../templates/importoverwritepopup.html');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ImportPopupTemplate = require('../../templates/importpopup.html');

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('../../router.setup', () => {
    const activeId = SidebarModel.instance.getCurrent()?.id;

    SidebarModel.instance.reset();

    setupSidePanels();

    SidebarModel.instance.notifyListeners(SidebarModelEvent.HotReload);

    if (activeId) {
      SidebarModel.instance.switch(activeId);
    }
  });
}

function setupSidePanels() {
  const isLesson = ProjectModel.instance.isLesson();

  installSidePanel({ isLesson });
}

export type EditorPageProps = IRouteProps;

export function EditorPage({ route }: EditorPageProps) {
  const [isLoading, setIsLoading] = useState(true);

  const appRegistry = useModel(AppRegistry.instance, ['documentChanged']);

  const Document = appRegistry.getActiveDocument();

  const [lesson, setLesson] = useState(null);
  const [frameDividerSize, setFrameDividerSize] = useState(undefined);

  useEffect(() => {
    // Display latest whats-new-post if the user hasn't seen one after it was last published
    whatsnewRender();

    NodePickerClearNews();

    SchemaHandler.instance = new SchemaHandler();

    if (!ProjectModel.instance.isLesson()) {
      CloudService.instance.prefetch();
    }

    setupSidePanels();
    installDocuments();

    const eventGroup = {};

    // Docs layer
    //DocsLayer.instance.render();
    //$('body').append(DocsLayer.instance.el);
    //broadcast new project name over udp to noodl-shells on the same network
    ipcRenderer.send('project-opened', ProjectModel.instance.name);

    // Listen to exit editor
    App.instance.off(this).on(
      'exitEditor',
      () => {
        route.router.route({ to: 'projects' });

        //close viewer window and broadcast that no project is open
        ipcRenderer.send('project-closed');
      },
      this
    );

    // Listen to project changed on disk, reload editor
    EventDispatcher.instance.on('projectChangedOnDisk', () => reloadProjectFromDisk(), eventGroup);
    EventDispatcher.instance.on('importFromUrl', (url) => importFromUrl(url), eventGroup);

    EventDispatcher.instance.on(
      'ProjectModel.saveFailedRetryScheduled',
      () => {
        ToastLayer.showError('Failed to save project, retrying...', 3000);
      },
      eventGroup
    );

    setIsLoading(false);

    return function () {
      EventDispatcher.instance.off(eventGroup);

      if (SchemaHandler.instance) {
        SchemaHandler.instance.dispose();
        SchemaHandler.instance = null;
      }

      //stop parse dashboard if it's running
      ParseDashboardServer.instance.stop();

      // Reset the cloud services token, since the tokens are per project.
      CloudService.instance.reset();
      SidebarModel.instance.reset();

      UndoQueue.instance.clear();
    };
  }, []);

  useKeyboardCommands(() => [
    {
      handler: () => SidebarModel.instance.switch('search'),
      keybinding: KeyMod.CtrlCmd | KeyCode.KEY_F
    },
    {
      handler: () => EventDispatcher.instance.emit('viewer-open-devtools'),
      keybinding: KeyMod.CtrlCmd | KeyCode.KEY_D
    },
    {
      handler: () => ipcRenderer.send('cloud-runtime-open-devtools'),
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_R
    },
    {
      handler: () => EventDispatcher.instance.emit('viewer-refresh'),
      keybinding: KeyMod.CtrlCmd | KeyCode.KEY_R
    },
    {
      // Refresh viewer and node library
      handler: () => {
        NodeLibraryImporter.instance.clear();
        EventDispatcher.instance.emit('viewer-refresh');
        ipcRenderer.send('cloud-runtime-refresh');

        ToastLayer.showInteraction('Refresh Node Library and viewers');
      },
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_X
    },
    {
      handler: () => exportProjectComponents(),
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_E
    },
    {
      handler: async () => {
        const environment = await CloudService.instance.getActiveEnvironment(ProjectModel.instance);
        if (environment) {
          ParseDashboardServer.instance.openInWindow(environment);
        }
      },
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_P
    },
    {
      handler: async () => {
        const environment = await CloudService.instance.getActiveEnvironment(ProjectModel.instance);
        if (environment) {
          ParseDashboardServer.instance.openInBrowser(environment);
        }
      },
      keybinding: KeyMod.CtrlCmd | KeyCode.KEY_P
    }
  ]);

  useSetupSettings();

  // Attach lesson
  useEffect(() => {
    if (!ProjectModel.instance.isLesson()) return;

    const lessonLayer = new LessonLayer();

    const projectModel = ProjectModel.instance;
    const element = lessonLayer.startLesson(projectModel.getLessonModel());
    setLesson({ el: element });

    return () => {
      lessonLayer.dispose();
    };
  }, []);

  return (
    <NodeGraphContextProvider>
      <NodeReferencesContextProvider>
        <ProjectDesignTokenContextProvider>
          <PluginContextProvider>
            <BaseWindow>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <FrameDivider
                    first={<SidePanel />}
                    second={<ErrorBoundary>{Boolean(Document) && <Document />}</ErrorBoundary>}
                    sizeMin={200}
                    size={frameDividerSize}
                    horizontal
                    onSizeChanged={setFrameDividerSize}
                  />

                  {Boolean(lesson) && <Frame instance={lesson} isContentSize isFitWidth />}
                </>
              )}
            </BaseWindow>
          </PluginContextProvider>
        </ProjectDesignTokenContextProvider>
      </NodeReferencesContextProvider>
    </NodeGraphContextProvider>
  );
}

function importFromUrl(url) {
  const activityId = 'import-from-url';

  PopupLayer.instance.hidePopup();

  ToastLayer.showActivity('Importing from url', activityId);

  const tmp = platform.getUserDataPath() + '/tmp/' + guid();
  FileSystem.instance.makeDirectory(tmp, function (r) {
    if (r.result !== 'success') {
      ToastLayer.hideActivity(activityId);
      ToastLayer.showError('Import failed');
      return;
    }

    unzipIntoDirectory(
      url,
      tmp,
      function (r) {
        ToastLayer.hideActivity(activityId);

        if (r.result !== 'success') {
          ToastLayer.showError("Couldn't load project from URL");
          return;
        }

        const validator = new ProjectValidator();
        validator.validateProjectDirectory(tmp);
        if (validator.hasErrors()) {
          ToastLayer.showError('This is not a valid Noodl project');
          return;
        }

        _importProject(tmp);
      },
      { skipLoad: true, noAuth: true }
    );
  });
}

function _importProject(dirEntry) {
  const activityId = 'import-project';
  ToastLayer.showActivity('Importing...', activityId);
  let selectedImports = {};

  ProjectImporter.instance.listComponentsAndDependencies(dirEntry, function (imports) {
    if (!imports) {
      ToastLayer.hideActivity(activityId);
      ToastLayer.showError('Could not load import project');
      return;
    }

    // Pre check all imports
    if (imports.components)
      imports.components.forEach((i) => {
        i.import = true;
      });

    if (imports.resources)
      imports.resources.forEach((r) => {
        r.import = true;
      });

    // Show popup and allow the user to choose which components to import
    var chooseImportsPopup = new ImportPopup({
      template: ImportPopupTemplate,
      imports: imports,
      onOk: function () {
        // User have made choice of what to import, check if there are any collisions
        selectedImports = chooseImportsPopup.getSelectedImports();
        ProjectImporter.instance.checkForCollisions(selectedImports, function (collisions) {
          ToastLayer.hideActivity(activityId);
          if (collisions === undefined) {
            // No collisions
            PopupLayer.instance.hideAllModalsAndPopups();
            doImport(selectedImports);
          } else {
            // There is a collision for import, promt user if we should overwrite
            const overwritePopup = new ImportPopup({
              template: ImportOverwritePopupTemplate,
              imports: collisions,
              onOk: function () {
                PopupLayer.instance.hideAllModalsAndPopups();
                doImport(selectedImports);
              },
              onCancel: function () {
                PopupLayer.instance.hideAllModalsAndPopups();
              }
            });
            overwritePopup.render();
            overwritePopup.el.css('width', '500px'); // Make it a little bit wider as a modal

            PopupLayer.instance.showModal({
              content: overwritePopup
            });
          }
        });
      },
      onCancel: function () {
        PopupLayer.instance.hideModal();
      }
    });
    chooseImportsPopup.render();
    chooseImportsPopup.el.css('width', '500px'); // Make it a little bit wider as a modal

    ToastLayer.hideActivity(activityId);
    PopupLayer.instance.showModal({
      content: chooseImportsPopup
    });
  });

  function doImport(imports) {
    ToastLayer.showActivity('Importing...', activityId);

    ViewerConnection.instance.setWatchModelChangesEnabled(false);
    ProjectImporter.instance.import(dirEntry, imports, function (r) {
      ViewerConnection.instance.setWatchModelChangesEnabled(true);
      ToastLayer.hideActivity(activityId);

      if (r.result !== 'success') {
        ToastLayer.showError(r.message);
        return;
      }

      ToastLayer.showSuccess('Import successful');

      // Reload the viewer
      EventDispatcher.instance.emit('ProjectModel.importComplete');
      EventDispatcher.instance.emit('viewer-refresh');
    });
  }
}

function reloadProjectFromDisk() {
  const hasActiveProject = ProjectModel.instance && ProjectModel.instance._retainedProjectDirectory;
  if (!hasActiveProject) {
    return;
  }
  ViewerConnection.instance.setWatchModelChangesEnabled(false);
  ProjectModel.setSaveOnModelChange(false);

  ProjectModel.instance.dispose(); // Unload current project

  projectFromDirectory(ProjectModel.instance._retainedProjectDirectory, (reloaded) => {
    ViewerConnection.instance.setWatchModelChangesEnabled(true);

    if (reloaded) {
      reloaded.id = ProjectModel.instance.id;
      ProjectModel.instance = reloaded;

      // Make sure the correct projects model tracks changes
      LocalProjectsModel.instance.bindProject(reloaded);

      ProjectModel.setSaveOnModelChange(true);
    }
  });
}

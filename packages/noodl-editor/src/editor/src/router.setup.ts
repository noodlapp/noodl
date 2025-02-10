import { AppRegistry } from '@noodl-models/app_registry';
import { SidebarModel } from '@noodl-models/sidebar';
import { Keybindings } from '@noodl-constants/Keybindings';

import { IconName } from '@noodl-core-ui/components/common/Icon';

import config from '../../shared/config/config';
import { ComponentDiffDocumentProvider } from './views/documents/ComponentDiffDocument';
import { EditorDocumentProvider } from './views/documents/EditorDocument';
import { CloudFunctionsPanel } from './views/panels/CloudFunctionsPanel/CloudFunctionsPanel';
import { CloudServicePanel } from './views/panels/CloudServicePanel/CloudServicePanel';
import { ComponentPortsComponent } from './views/panels/componentports';
import { ComponentsPanel } from './views/panels/componentspanel';
import { DesignTokenPanel } from './views/panels/DesignTokenPanel/DesignTokenPanel';
import { EditorSettingsPanel } from './views/panels/EditorSettingsPanel/EditorSettingsPanel';
import { FileExplorerPanel } from './views/panels/FileExplorerPanel';
import { NodeReferencesPanel_ID } from './views/panels/NodeReferencesPanel';
import { NodeReferencesPanel } from './views/panels/NodeReferencesPanel/NodeReferencesPanel';
import { ProjectSettingsPanel } from './views/panels/ProjectSettingsPanel/ProjectSettingsPanel';
import { PropertyEditor } from './views/panels/propertyeditor';
import { SearchPanel } from './views/panels/search-panel/search-panel';
import { UndoQueuePanel } from './views/panels/UndoQueuePanel/UndoQueuePanel';
import { VersionControlPanel_ID } from './views/panels/VersionControlPanel';
import { VersionControlPanel } from './views/panels/VersionControlPanel/VersionControlPanel';

export interface SetupEditorOptions {
  isLesson: boolean;
}

export function installSidePanel({ isLesson }: SetupEditorOptions) {
  const appRegistry = AppRegistry.instance;

  SidebarModel.instance.register({
    transient: true,
    id: 'PropertyEditor',
    name: 'Properties',
    // @ts-expect-error
    panel: PropertyEditor
  });

  SidebarModel.instance.register({
    transient: true,
    id: 'PortEditor',
    name: 'Ports',
    panel: ComponentPortsComponent
  });

  SidebarModel.instance.register({
    id: 'components',
    name: 'Components',
    order: 1,
    icon: IconName.Components,
    onOpen: () => {
      if (appRegistry.CurrentDocumentId !== EditorDocumentProvider.ID) {
        appRegistry.openDocument(EditorDocumentProvider.ID);
      }
    },
    panelProps: {
      // This is a temporary solution so we can keep the state of open folder etc
      options: {
        showSheetList: true,
        hideSheets: ['__cloud__']
      }
    },
    panel: ComponentsPanel
  });

  SidebarModel.instance.register({
    id: 'search',
    name: 'Search',
    fineType: Keybindings.SEARCH.label,
    order: 2,
    icon: IconName.Search,
    panel: SearchPanel
  });

  SidebarModel.instance.register({
    id: VersionControlPanel_ID,
    name: 'Version control',
    order: 5,
    icon: IconName.StructureCircle,
    panel: VersionControlPanel
  });

  SidebarModel.instance.register({
    id: 'cloudservice',
    name: 'Cloud Services',
    isDisabled: isLesson === true,
    order: 6,
    icon: IconName.CloudData,
    panel: CloudServicePanel
  });

  SidebarModel.instance.register({
    id: 'cloud-functions',
    name: 'Cloud Functions',
    isDisabled: isLesson === true,
    order: 7,
    icon: IconName.CloudFunction,
    panel: CloudFunctionsPanel
  });

  SidebarModel.instance.register({
    id: 'settings',
    name: 'Project settings',
    order: 8,
    icon: IconName.Setting,
    panel: ProjectSettingsPanel
  });

  if (config.devMode) {
    SidebarModel.instance.register({
      experimental: true,
      id: 'file-explorer',
      name: 'File Explorer',
      order: 19,
      icon: IconName.FolderOpen,
      panel: FileExplorerPanel
    });

    SidebarModel.instance.register({
      experimental: true,
      id: 'design-tokens',
      name: 'Design Tokens',
      order: 20,
      icon: IconName.Palette,
      panel: DesignTokenPanel
    });

    SidebarModel.instance.register({
      experimental: true,
      id: 'undo-queue',
      name: 'Undo Queue',
      order: 21,
      icon: IconName.Reset,
      panel: UndoQueuePanel
    });
  }

  SidebarModel.instance.register({
    experimental: true,
    id: NodeReferencesPanel_ID,
    name: 'Node References',
    description: 'Node References Panel is showing how many times each core node and component is used.',
    order: 23,
    icon: IconName.Component,
    panel: NodeReferencesPanel
  });

  SidebarModel.instance.register({
    id: 'editor-settings',
    name: 'Editor settings',
    order: 1,
    placement: 'bottom',
    icon: IconName.SlidersHorizontal,
    panel: EditorSettingsPanel
  });
}

export function installDocuments() {
  const appRegistry = AppRegistry.instance;

  // Register EditorDocumentProvider
  appRegistry.registerDocumentProvider(EditorDocumentProvider.ID, new EditorDocumentProvider());
  appRegistry.openDocument(EditorDocumentProvider.ID);

  appRegistry.registerDocumentProvider(ComponentDiffDocumentProvider.ID, new ComponentDiffDocumentProvider());

  if (import.meta.webpackHot) {
    import.meta.webpackHot.accept('./views/documents/EditorDocument', () => {
      AppRegistry.instance.registerDocumentProvider(EditorDocumentProvider.ID, new EditorDocumentProvider());
    });
    import.meta.webpackHot.accept('./views/documents/ComponentDiffDocument', () => {
      AppRegistry.instance.registerDocumentProvider(
        ComponentDiffDocumentProvider.ID,
        new ComponentDiffDocumentProvider()
      );
    });
  }
}

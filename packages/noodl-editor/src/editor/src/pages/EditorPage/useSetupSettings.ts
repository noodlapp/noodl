import { useEffect } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';
import { SidebarModel } from '@noodl-models/sidebar';
import { SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';
import { EditorSettings } from '@noodl-utils/editorsettings';

export function useSetupSettings() {
  useEffect(() => {
    const eventGroup = {};

    // Set the active side panel
    const projectEditorSettings = EditorSettings.instance.get(ProjectModel.instance.id) || {};

    const savedPanelId = projectEditorSettings['editor-sidebar-panel'];
    const panelExists = savedPanelId && SidebarModel.instance.getItems().find((p) => p.id === savedPanelId);

    const panelId = panelExists ? savedPanelId : 'components';
    SidebarModel.instance.switch(panelId);

    // Save changes to side panel
    SidebarModel.instance.on(
      SidebarModelEvent.activeChanged,
      () => {
        if (!ProjectModel.instance) return;

        const currentPanel = SidebarModel.instance.getCurrent();
        if (!currentPanel.transient) {
          EditorSettings.instance.setMerge(ProjectModel.instance.id, { 'editor-sidebar-panel': currentPanel.id });
        }
      },
      eventGroup
    );

    return () => {
      SidebarModel.instance.off(eventGroup);
    };
  }, []);
}

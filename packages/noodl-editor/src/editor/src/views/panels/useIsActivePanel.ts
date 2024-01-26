import { useEffect, useState } from 'react';

import { SidebarModel, SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';

export function useIsActivePanel(panelId: string) {
  const [isActivePanel, setActivePanel] = useState(SidebarModel.instance.getCurrent().id === panelId);

  useEffect(() => {
    const eventRef = {};
    SidebarModel.instance.on(
      SidebarModelEvent.activeChanged,
      () => {
        setActivePanel(SidebarModel.instance.getCurrent().id === panelId);
      },
      eventRef
    );

    return () => {
      SidebarModel.instance.off(eventRef);
    };
  }, []);

  return isActivePanel;
}

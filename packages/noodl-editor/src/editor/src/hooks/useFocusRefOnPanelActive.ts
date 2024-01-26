import { useEffect } from 'react';

import { SidebarModel } from '@noodl-models/sidebar';
import { SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';

export function useFocusRefOnPanelActive(inputRef: React.MutableRefObject<HTMLElement>, panelId: string) {
  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    const eventRef = {};

    SidebarModel.instance.on(
      SidebarModelEvent.activeChanged,
      (activeId, previousActiveId) => {
        if (activeId === panelId && panelId !== previousActiveId) {
          //not sure why this timeout is required, but it doesn't work without it
          setTimeout(() => {
            inputRef.current?.focus();
          }, 10);
        }
      },
      eventRef
    );

    return () => {
      SidebarModel.instance.off(eventRef);
    };
  }, [inputRef.current, panelId]);
}

export function useOnPanelActive(func: () => void, panelId: string) {
  useEffect(() => {
    const eventRef = {};
    SidebarModel.instance.on(
      SidebarModelEvent.activeChanged,
      (activeId, previousActiveId) => {
        if (activeId === panelId && panelId !== previousActiveId) {
          //not sure why this timeout is required, but it doesn't work without it
          setTimeout(() => {
            func();
          }, 10);
        }
      },
      eventRef
    );

    return () => {
      SidebarModel.instance.off(eventRef);
    };
  }, [func, panelId]);
}

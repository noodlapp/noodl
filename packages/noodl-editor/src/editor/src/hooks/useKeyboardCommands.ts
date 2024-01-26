import { useModernModel } from '@noodl-hooks/useModel';
import { useEffect } from 'react';

import { SidebarModel } from '@noodl-models/sidebar';
import { SidebarModelEvent } from '@noodl-models/sidebar/sidebarmodel';
import KeyboardHandler, { KeyboardCommand } from '@noodl-utils/keyboardhandler';

export function useKeyboardCommands(createCommandsFn: () => KeyboardCommand[], deps?: React.DependencyList) {
  useEffect(() => {
    const commands = createCommandsFn();

    KeyboardHandler.instance.registerCommands(commands);

    return () => {
      KeyboardHandler.instance.deregisterCommands(commands);
    };
  }, deps || []);
}

/**
 * The Side Panel is always active,
 * so lets unregister the commands while it is not visible.
 *
 * @param createCommandsFn
 * @param panelId
 * @param deps
 */
export function useSidePanelKeyboardCommands(
  createCommandsFn: () => KeyboardCommand[],
  panelId: string,
  deps?: React.DependencyList
) {
  const sidebarModel = useModernModel(SidebarModel.instance, [SidebarModelEvent.activeChanged]);
  const activeId = sidebarModel.ActiveId;

  useEffect(() => {
    if (activeId !== panelId) return;

    const commands = createCommandsFn();

    KeyboardHandler.instance.registerCommands(commands);

    return () => {
      KeyboardHandler.instance.deregisterCommands(commands);
    };
  }, [...(deps || []), panelId, activeId]);
}

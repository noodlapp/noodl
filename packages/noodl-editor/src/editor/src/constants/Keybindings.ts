import { Keybinding } from '@noodl-utils/keyboard/Keybinding';
import { KeyCode, KeyMod } from '@noodl-utils/keyboard/KeyCode';

export namespace Keybindings {
  export const SEARCH = new Keybinding(KeyMod.CtrlCmd, KeyCode.KEY_F);

  export const CLOUD_SERVICE_OPEN_DASHBOARD = new Keybinding(KeyMod.CtrlCmd, KeyMod.Shift, KeyCode.KEY_P);
  export const CLOUD_SERVICE_OPEN_DASHBOARD_BROWSER = new Keybinding(KeyMod.CtrlCmd, KeyCode.KEY_P);

  export const REFRESH_PREVIEW = new Keybinding(KeyMod.CtrlCmd, KeyCode.KEY_R);
  export const OPEN_DEVTOOLS = new Keybinding(KeyMod.CtrlCmd, KeyCode.KEY_D);
  export const OPEN_CLOUD_DEVTOOLS = new Keybinding(KeyMod.CtrlCmd, KeyMod.Shift, KeyCode.KEY_R);
  export const TOGGLE_PREVIEW_MODE = new Keybinding(KeyMod.CtrlCmd, KeyCode.KEY_T);

  export const PROPERTY_PANEL_OPEN_DOCS = new Keybinding(KeyCode.F1);
  export const PROPERTY_PANEL_EDIT_LABEL = new Keybinding(KeyCode.Enter);
  export const PROPERTY_PANEL_EDIT_LABEL2 = new Keybinding(KeyCode.F2);
  export const PROPERTY_PANEL_DELETE = new Keybinding(KeyCode.Delete); // Actually node graph delete
}

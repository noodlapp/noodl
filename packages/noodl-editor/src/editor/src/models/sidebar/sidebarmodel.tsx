import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import React from 'react';

import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { EditorSettings } from '@noodl-utils/editorsettings';
import { Model } from '@noodl-utils/model';

import { IconName } from '@noodl-core-ui/components/common/Icon';

export interface SidebarItem<TProps = Record<string, unknown>> {
  id: string;
  name: string;
  description?: string;
  fineType?: string;
  icon?: IconName;
  order?: number;

  /**
   * Lasting only for a short time.
   * The panel will be re-created every time.
   *
   * Default: false
   */
  transient?: boolean;

  placement?: 'top' | 'bottom';

  isDisabled?: boolean /** Default: false */;

  /** Default: false */
  experimental?: boolean;

  onOpen?: () => void;
  onClose?: () => void;
  onClick?: () => void;

  panelProps?: TProps;
  panel: React.ComponentType<TProps>;
}

/**
 * Returns the sidepanel we want to show for this node.
 *
 * @param node Node instance?
 * @returns The side panel name.
 */
function getNodePanelName(nodeModel: NodeGraphNode): { id: string; args?: TSFixme } {
  if (!nodeModel.type.panels) return { id: 'PropertyEditor' };
  if (nodeModel.type.panels === 'none') return { id: 'none' };

  const registeredPanels = SidebarModel.instance.getItems();
  const valids = nodeModel.type.panels.filter((x) => registeredPanels.find((b) => b.id == x.name));
  if (valids.length > 0) {
    return {
      id: valids[0].name,
      args: valids[0]
    };
  }

  return { id: 'PropertyEditor' };
}

function createPanel(type: string, args: { [key: string]: unknown }): () => React.ReactElement {
  const items = SidebarModel.instance.getItems();

  const item = items.find((x) => x.id === type);
  if (!item) {
    throw new Error(`Panel not found. (${type})`);
  }

  // eslint-disable-next-line react/display-name
  return () => React.createElement(item.panel, { ...args, ...(item.panelProps || {}) });
}

const getExperimentalSettingsKey = (item: SidebarItem) => `experimental.panel.${item.id}`;

export enum SidebarModelEvent {
  /** Occurs when a new panel is added. */
  itemsChanged = 'itemsChanged',
  /** Occurs when a panel is selected. */
  activeChanged = 'activeChanged',
  nodeSelected = 'nodeSelected',
  receivedCommand = 'receivedCommand',
  HotReload = 'HotReload'
}

export type SidebarModelEventEvents = {
  [SidebarModelEvent.itemsChanged]: () => void;
  [SidebarModelEvent.activeChanged]: (panelId: string, previousActiveId: string) => void;
  [SidebarModelEvent.nodeSelected]: (nodeId: string) => void;
  [SidebarModelEvent.receivedCommand]: (panelId: string, command: string, args: unknown[] | any) => void;
  [SidebarModelEvent.HotReload]: () => void;
};

/**
 * The Sidebar Model.
 *
 * ## Nodes
 * Nodes can have custom panels when selected.
 *
 * Before telling a node to use a specific panel we have to register it with
 * SidebarModel. Which is done by calling register.
 *
 * To add a custom panel to a node, you have to add it to the **node definition**.
 * ```js
 *  {
 *    ...
 *    panels: [
 *      {
 *        name: "PortEditor",
 *      }
 *    ],
 *    ...
 *  }
 * ```
 *
 */
export class SidebarModel extends Model<SidebarModelEvent, SidebarModelEventEvents> {
  public static instance = new SidebarModel();

  private activeId: string;
  private previousActiveId: string;
  private items: SidebarItem[] = [];
  private experimentalItems: SidebarItem[] = [];

  private panels: {
    [key: string]: () => React.ReactElement;
  } = {};

  private groupRef = {};

  public get ActiveId(): string {
    return this.activeId;
  }

  constructor() {
    super();

    EditorSettings.instance.on(
      'updated',
      ({ key }: { key: string }) => {
        // Check if the key is an experimental panel
        const experimentalKeys = this.experimentalItems.map(getExperimentalSettingsKey);
        if (!experimentalKeys.includes(key)) {
          return;
        }

        const enabled = EditorSettings.instance.get(key);
        const id = key.split('.').at(-1);

        if (enabled) {
          const experimentalItem = this.experimentalItems.find((x) => x.id === id);

          // Check if item exists
          if (!experimentalItem) {
            return;
          }

          // Already enabled
          if (this.items.some((x) => x.id === id)) {
            return;
          }

          // Enable the item
          this.items.push(experimentalItem);
          this.notifyListeners(SidebarModelEvent.itemsChanged);
        } else {
          const index = this.items.findIndex((x) => x.id === id);
          if (index >= 0) {
            this.items.splice(index, 1);
            this.notifyListeners(SidebarModelEvent.itemsChanged);
          }
        }
      },
      this.groupRef
    );
  }

  public reset() {
    this.activeId = undefined;
    this.previousActiveId = undefined;

    this.items = [];
    this.experimentalItems = [];
    this.panels = {};
  }

  // TODO: Rename to getActive()
  public getCurrent(): SidebarItem {
    return this.items.find((x) => x.id === this.activeId) || this.items[0];
  }

  public getPanel(panelId: string) {
    return this.items.find((x) => x.id === panelId) || null;
  }

  public getPanelComponent(panelId: string): () => React.ReactElement {
    if (panelId) {
      return this.panels[panelId];
    }
    return null;
  }

  public getActive(): () => React.ReactElement | null {
    if (this.activeId) {
      return this.panels[this.activeId];
    }
    return null;
  }

  public getItems(): readonly SidebarItem[] {
    return this.items.sort((a, b) => a.order - b.order);
  }

  public getVisibleItems(): readonly SidebarItem[] {
    return this.getItems().filter((x) => !x.transient);
  }

  public getExperimentalItems() {
    return this.experimentalItems
      .filter((x) => !x.transient)
      .map((x) => ({
        id: x.id,
        settingsKey: getExperimentalSettingsKey(x),
        name: x.name,
        description: x.description,
        enabled: !!EditorSettings.instance.get(getExperimentalSettingsKey(x))
      }));
  }

  public register<TProps extends Record<string, unknown>>(item: SidebarItem<TProps>): void {
    // Set default placement
    if (!item.placement) {
      item.placement = 'top';
    }

    if (item.experimental) {
      this.experimentalItems.push(item);

      if (EditorSettings.instance.get(getExperimentalSettingsKey(item))) {
        this.items.push(item);
        this.notifyListeners(SidebarModelEvent.itemsChanged);
      }
    } else {
      this.items.push(item);
      this.notifyListeners(SidebarModelEvent.itemsChanged);
    }
  }

  /**
   *
   * @param id The panel id.
   * @returns
   */
  public switch(id: string): boolean {
    if (this.activeId === id) {
      return true;
    }

    // Debug info
    // let logText = `switch side panel to: '${id}'`;
    // if (this.activeId) logText += ` (from: ${this.activeId})`;
    // console.log(logText);
    try {
      if (this.panels[id]) {
        const lastActiveTab = this.items.find((x) => x.id === this.activeId);
        if (lastActiveTab) {
          lastActiveTab.onClose && lastActiveTab.onClose();
        }

        this.activeId = id;
        this.notifyListeners(SidebarModelEvent.activeChanged, this.activeId, this.previousActiveId);

        const newActiveTab = this.items.find((x) => x.id === this.activeId);
        if (newActiveTab) {
          newActiveTab.onOpen && newActiveTab.onOpen();
        }

        return true;
      }

      // Create the panel
      this.setActivePanel(id, false, createPanel(id, {}));
      return true;
    } catch (error) {
      // This is most likely caused by missing panel or some error creating
      // the panel. Lets try to select the first visible item, so the user
      // will have some panel.
      const visibleItems = this.getVisibleItems().filter((item) => item.panel);
      if (visibleItems.length > 0 && visibleItems[0].id === id) {
        this.switch(visibleItems[0].id);
        return;
      }

      // In case it fails we still continue since this can be
      // user created code too.
      console.error(error);
      return false;
    }
  }

  public switchToNode(nodeModel: NodeGraphNode) {
    const { id, args } = getNodePanelName(nodeModel);

    //remember what panel was active before we selected a node
    //but only if it was a visible icon in the sidebar (e.g. not another PropertyEditor or similar)
    if (!this.getCurrent()?.transient) {
      this.previousActiveId = this.activeId;
    }

    this.setActivePanel(
      id,
      true,
      createPanel(id, {
        model: nodeModel,
        ...args
      })
    );
    this.notifyListeners(SidebarModelEvent.nodeSelected, nodeModel.id);
  }

  /**
   * Used by "doubleClick"
   *
   * @param command
   */
  public invokeActive(command: string, args?: unknown) {
    this.notifyListeners(SidebarModelEvent.receivedCommand, this.activeId, command, args);
  }

  public hidePanels() {
    if (this.previousActiveId) {
      this.switch(this.previousActiveId);
      this.previousActiveId = undefined;
    } else {
      const isFrontend = NodeGraphContextTmp.active === 'frontend';
      const newPanel = isFrontend ? 'components' : 'cloud-functions';
      this.switch(newPanel);
    }
  }

  private setActivePanel(id: string, force: boolean, component: () => React.ReactElement): void {
    const lastActiveTab = this.items.find((x) => x.id === this.activeId);
    if (lastActiveTab) {
      lastActiveTab.onClose && lastActiveTab.onClose();
    }

    this.activeId = id;

    if (force || !this.panels[id]) {
      if (this.panels[id]) {
        delete this.panels[id];
      }

      this.panels[id] = component;
    }

    this.notifyListeners(SidebarModelEvent.activeChanged, this.activeId, this.previousActiveId);

    const newActiveTab = this.items.find((x) => x.id === this.activeId);
    if (newActiveTab) {
      newActiveTab.onOpen && newActiveTab.onOpen();
    }
  }
}

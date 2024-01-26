import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Text } from '../../typography/Text';
import css from './Tabs.module.scss';

export enum TabsVariant {
  Default = 'is-variant-default',
  Text = 'is-variant-text',
  Sidebar = 'is-variant-sidebar'
}

export interface TabsTab {
  label: string;
  id?: string;
  content: Slot;
  testId?: string;
}

export interface TabsProps extends UnsafeStyleProps {
  tabs: TabsTab[];
  /**
   * Set the initial active tab, updating this value will not change the tab.
   */
  initialActiveTab?: TabsTab['label'];
  /**
   * Set the active tab, updating this value will change the active tab.
   */
  activeTab?: TabsTab['label'];
  variant?: TabsVariant;

  keepTabsAlive?: boolean;

  onChange?: (activeTab: string) => void;
}

function getTabId(tab: TabsTab) {
  return tab.hasOwnProperty('id') ? tab.id : tab.label;
}

export function Tabs({
  tabs,
  initialActiveTab,
  activeTab,
  variant = TabsVariant.Default,
  keepTabsAlive = false,

  onChange,

  UNSAFE_className,
  UNSAFE_style
}: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(() => initialActiveTab || getTabId(tabs[0]));

  useEffect(() => {
    if (!activeTab) return;

    setActiveTabId(activeTab);
  }, [activeTab]);

  const tabWidth = `calc(${100 / tabs.length}% - 2px)`;

  function changeTab(tab: TabsTab) {
    const tabId = getTabId(tab);
    setActiveTabId(tabId);
    onChange && onChange(tabId);
  }

  return (
    <div className={classNames(css['Root'], css[variant], UNSAFE_className)} style={UNSAFE_style}>
      <nav className={css['Buttons']}>
        {tabs.map((tab) => (
          <button
            key={getTabId(tab)}
            className={classNames([
              css['Button'],
              activeTabId === getTabId(tab) && css['is-active']
            ])}
            onClick={() => changeTab(tab)}
            style={{ width: variant === TabsVariant.Text ? null : tabWidth }}
            data-test={tab.testId}
          >
            <Text>{tab.label}</Text>
          </button>
        ))}
      </nav>

      <div className={css['TabContent']}>
        {Boolean(keepTabsAlive)
          ? tabs.map((tab) => {
              const tabId = getTabId(tab);
              return (
                <div
                  key={tabId}
                  className={css['KeepAliveTab']}
                  style={{ display: tabId === activeTabId ? 'block' : 'none' }}
                >
                  {tab.content}
                </div>
              );
            })
          : tabs.find((tab) => getTabId(tab) === activeTabId).content}
      </div>
    </div>
  );
}

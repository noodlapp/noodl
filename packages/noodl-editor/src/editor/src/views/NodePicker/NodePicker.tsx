import classNames from 'classnames';
import React from 'react';

import { Tabs, TabsVariant } from '@noodl-core-ui/components/layout/Tabs';

import { NodePickerContextProvider, useNodePickerContext } from './NodePicker.context';
import css from './NodePicker.module.scss';
import { ImportFromProject } from './tabs/ImportFromProject/ImportFromProject';
import { NodeLibrary, NodeLibraryProps } from './tabs/NodeLibrary/NodeLibrary';
import { NodePickerSearchView } from './tabs/NodePickerSearchView';

type NodePickerProps = NodeLibraryProps;

const NODE_LIBRARY_LABEL = 'Nodes';
const PREFAB_LIBRARY_LABEL = 'Prefabs';
const MODULE_LIBRARY_LABEL = 'Modules';
const PROJECT_IMPORT_LABEL = 'Import from project';

function NodePickerWithoutContext({ model, parentModel, pos, attachToRoot, runtimeType }: NodePickerProps) {
  const context = useNodePickerContext();

  const tabs = [
    {
      label: NODE_LIBRARY_LABEL,
      content: (
        <NodeLibrary
          model={model}
          parentModel={parentModel}
          pos={pos}
          attachToRoot={attachToRoot}
          runtimeType={runtimeType}
        />
      )
    }
  ];

  tabs.push({
    label: PREFAB_LIBRARY_LABEL,
    content: <NodePickerSearchView key="prefabs" itemType="prefab" searchInputPlaceholder="Search for a prefab" />
  });

  tabs.push({
    label: MODULE_LIBRARY_LABEL,
    content: (
      <NodePickerSearchView key="modules" itemType="module" searchInputPlaceholder="Search for an external library" />
    )
  });

  tabs.push({
    label: PROJECT_IMPORT_LABEL,
    content: <ImportFromProject />
  });

  return (
    <div className={css['Root']}>
      <Tabs
        UNSAFE_className={css['TabOverride']}
        variant={TabsVariant.Text}
        tabs={tabs}
        activeTab={context.activeTab}
        onChange={(activeTab) => {
          context.setActiveTab(activeTab);
        }}
      />

      <div className={classNames(css['Blocker'], context.isBlocked && css['is-visible'])} />

      <div className={css['ShadowWrapper']}>
        <div className={css['Shadow']}></div>
      </div>
    </div>
  );
}

export function NodePicker(props) {
  return (
    <NodePickerContextProvider>
      <NodePickerWithoutContext {...props} />
    </NodePickerContextProvider>
  );
}

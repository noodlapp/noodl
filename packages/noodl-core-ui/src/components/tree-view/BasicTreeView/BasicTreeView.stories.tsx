import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import {
  BasicNodeItem,
  BasicTreeView,
  ComponentListIconName
} from '@noodl-core-ui/components/tree-view/BasicTreeView';
import { ContextMenu } from '@noodl-core-ui/components/popups/ContextMenu';
import { IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';

export default {
  title: 'Tree View/Basic Tree View',
  component: BasicTreeView,
  argTypes: {}
} as ComponentMeta<typeof BasicTreeView>;

export const Common: ComponentStory<typeof BasicTreeView> = (args) => {
  return (
    <div style={{ width: 280 }}>
      <BasicTreeView {...args} />
    </div>
  );
};
Common.args = {
  items: [
    {
      id: 1,
      icon: ComponentListIconName.Folder,
      text: 'Folder 1',
      children: [
        {
          id: 2,
          icon: IconName.File,
          text: 'File 1-1'
        },
        {
          id: 3,
          icon: IconName.File,
          text: 'File 1-1'
        }
      ]
    },
    {
      id: 4,
      icon: ComponentListIconName.Folder,
      text: 'Folder 2',
      children: [
        {
          id: 5,
          icon: ComponentListIconName.Folder,
          text: 'Folder 2-1',
          children: [
            {
              id: 6,
              icon: IconName.File,
              text: 'File 2-1-1'
            }
          ]
        }
      ]
    }
  ] as BasicNodeItem[]
};

function ComponentListContextMenu() {
  return (
    <ContextMenu
      variant={IconButtonVariant.SemiTransparent}
      menuItems={[
        {
          label: 'FIXME: THIS CONTEXT MENU IS TEMPORARY AND SHOULD BE REPLACED'
        },
        {
          label: 'Rename'
        },
        {
          label: 'Delete'
        },
        { label: 'Duplicate' }
      ]}
    />
  );
}

export const ComponentList = Common.bind({});
ComponentList.args = {
  items: [
    {
      id: 1,
      icon: ComponentListIconName.HomeComponent,
      text: 'Home Page Component',
      endSlot: <ComponentListContextMenu />
    },
    {
      id: 2,
      icon: ComponentListIconName.PageComponent,
      text: 'Page Component',
      endSlot: <ComponentListContextMenu />
    },
    {
      id: 3,
      icon: ComponentListIconName.PageComponent,
      text: 'Page Component with children',
      endSlot: <ComponentListContextMenu />,
      children: [
        {
          id: 4,
          icon: ComponentListIconName.NestedComponent,
          text: 'Nested Component',
          endSlot: <ComponentListContextMenu />
        },
        {
          id: 5,
          icon: ComponentListIconName.NestedComponent,
          text: 'Nested Component',
          endSlot: <ComponentListContextMenu />
        }
      ]
    },
    {
      id: 6,
      icon: ComponentListIconName.Folder,
      text: 'Folder',
      endSlot: <ComponentListContextMenu />,
      children: [
        {
          id: 7,
          icon: ComponentListIconName.Component,
          text: 'Component in folder',
          endSlot: <ComponentListContextMenu />
        }
      ]
    },
    {
      id: 8,
      icon: ComponentListIconName.ComponentWithChildren,
      text: 'Component with children',
      endSlot: <ComponentListContextMenu />,
      children: [
        {
          id: 9,
          icon: ComponentListIconName.NestedComponent,
          text: 'Nested Component',
          endSlot: <ComponentListContextMenu />
        },
        {
          id: 10,
          icon: ComponentListIconName.NestedComponent,
          text: 'Nested Component',
          endSlot: <ComponentListContextMenu />
        }
      ]
    },
    {
      id: 11,
      icon: ComponentListIconName.Component,
      text: 'Component',
      endSlot: <ComponentListContextMenu />
    }
  ]
};

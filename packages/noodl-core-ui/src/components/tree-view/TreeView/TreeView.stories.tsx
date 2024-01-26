import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  TreeView,
  TreeViewChildProps,
  SimpleTreeViewItem
} from '@noodl-core-ui/components/tree-view/TreeView';
import { Text } from '@noodl-core-ui/components/typography/Text';

export default {
  title: 'Tree View/Tree View',
  component: TreeView,
  argTypes: {}
} as ComponentMeta<typeof TreeView>;

interface NodeProps extends TreeViewChildProps<SimpleTreeViewItem> {}
function Node({ depth, item, children, onClick }: NodeProps) {
  return (
    <div data-id={item.id} data-depth={depth}>
      <div style={{ display: 'flex' }} onClick={onClick}>
        <div style={{ width: "60px" }}>
          <Text>depth: {depth}</Text>  
        </div>
        <Text>
          data: {JSON.stringify(item)}
        </Text>
      </div>
      <div>{children}</div>
    </div>
  );
}

const Template: ComponentStory<typeof TreeView> = (args) => <TreeView {...args} />;

export const Common = Template.bind({});
Common.args = {
  node: Node,
  items: [
    {
      id: 1,
      children: [
        {
          id: 2
        },
        {
          id: 3
        }
      ]
    },
    {
      id: 4,
      children: [
        {
          id: 5,
          children: [
            {
              id: 6
            }
          ]
        }
      ]
    }
  ]
};

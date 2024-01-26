import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { GitHistoryItem } from './GitHistoryItem';

export default {
  title: 'Version Control/History Item',
  component: GitHistoryItem,
  argTypes: {}
} as ComponentMeta<typeof GitHistoryItem>;

const Template: ComponentStory<typeof GitHistoryItem> = (args) => (
  <div style={{ width: 280 }}>
    <GitHistoryItem {...args}></GitHistoryItem>
  </div>
);

export const Common = Template.bind({});
Common.args = {
  branches: [
    {
      bottom: true,
      circle: true,
      color: '#c4c4c4',
      isHead: undefined,
      top: false,
      x: 0
    }
  ],
  message: 'Commit message',
  date: 'Wed, Jul 12, 04:32 PM',
  badge: {
    label: 'JD',
    color: 'red'
  }
};

export const FirstCommit = Template.bind({});
FirstCommit.args = {
  branches: [
    {
      bottom: false,
      circle: true,
      color: '#FDBB00',
      isHead: false,
      top: true,
      topColor: '#FDBB00',
      x: 0
    }
  ],
  message: 'Project created',
  date: 'Wed, Jul 12, 04:32 PM',
  badge: {
    label: 'JD',
    color: 'red'
  }
};

export const LocalChanges = Template.bind({});
LocalChanges.args = {
  branches: [
    {
      bottom: true,
      circle: true,
      color: '#c4c4c4',
      isHead: true,
      top: false,
      x: 28
    }
  ],
  message: 'Local changes',
  date: undefined,
  badge: undefined
};

export const BeforeLocalChanges = Template.bind({});
BeforeLocalChanges.args = {
  branches: [
    {
      bottom: true,
      branchPoints: [{ color: '#c4c4c4', x: 28 }],
      circle: true,
      color: '#FDBB00',
      isHead: false,
      top: false,
      topColor: '#FDBB007F',
      x: 0
    }
  ],
  message: 'Small fixes when stating up',
  date: 'Wed, Jul 12, 04:32 PM',
  badge: {
    label: 'JD',
    color: 'red'
  }
};

export const LongCommitMessage = Template.bind({});
LongCommitMessage.args = {
  branches: [
    {
      bottom: true,
      branchPoints: [{ color: '#c4c4c4', x: 28 }],
      circle: true,
      color: '#FDBB00',
      isHead: false,
      top: false,
      topColor: '#FDBB007F',
      x: 0
    }
  ],
  message:
    'Hey look at, yup, it an invalid link, http://localhost:6006/?path=/story/version-control-history-item--common/story/version-control-history-item--common',
  date: 'Wed, Jul 12, 04:32 PM',
  badge: {
    label: 'JD',
    color: 'red'
  }
};

import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { FrameDivider, FrameDividerOwner } from './FrameDivider';
import { TestView } from '@noodl-core-ui/components/layout/TestView/TestView';

export default {
  title: 'Layout/Frame Divider',
  component: FrameDivider,
  argTypes: {}
} as ComponentMeta<typeof FrameDivider>;

const Template: ComponentStory<typeof FrameDivider> = (args) => (
  <div style={{ width: 1280, height: 800, background: 'lightgray' }}>
    <FrameDivider
      {...args}
      first={<TestView backgroundColor="#ff3f34" />}
      second={<TestView backgroundColor="#05c46b" />}
    ></FrameDivider>
  </div>
);

export const Horizontal = Template.bind({});
Horizontal.args = {
  horizontal: true
};

export const Vertical = Template.bind({});
Vertical.args = {
  horizontal: false
};

export const Editor3Horizontal: ComponentStory<typeof FrameDivider> = () => {
  const [firstSize, setFirstSize] = useState(343);
  const [secondSize, setSecondSize] = useState(343);

  return (
    <div style={{ width: 1280, height: 800, background: 'lightgray' }}>
      <FrameDivider
        sizeMin={200}
        size={firstSize}
        onSizeChanged={setFirstSize}
        first={<TestView backgroundColor="#ff3f34" />}
        second={
          <FrameDivider
            onSizeChanged={setSecondSize}
            size={secondSize}
            splitOwner={FrameDividerOwner.Second}
            sizeMin={200}
            first={<TestView backgroundColor="#0fbcf9" />}
            second={<TestView backgroundColor="#05c46b" />}
            horizontal
          />
        }
        horizontal
      />
    </div>
  );
};
export const Editor3Vertical: ComponentStory<typeof FrameDivider> = () => {
  const [firstSize, setFirstSize] = useState(300);
  const [secondSize, setSecondSize] = useState(300);

  return (
    <div style={{ width: 1280, height: 800, background: 'lightgray' }}>
      <FrameDivider
        sizeMin={200}
        sizeMax={300}
        size={firstSize}
        onSizeChanged={setFirstSize}
        first={<TestView backgroundColor="#ff3f34" />}
        second={
          <FrameDivider
            onSizeChanged={setSecondSize}
            size={secondSize}
            splitOwner={FrameDividerOwner.Second}
            sizeMin={200}
            first={<TestView backgroundColor="#0fbcf9" />}
            second={<TestView backgroundColor="#05c46b" />}
          />
        }
      />
    </div>
  );
};

export const Editor2Horizontal1Vertical: ComponentStory<typeof FrameDivider> = () => {
  const [firstSize, setFirstSize] = useState(300);
  const [secondSize, setSecondSize] = useState(300);

  return (
    <div style={{ width: 1280, height: 800, background: 'lightgray' }}>
      <FrameDivider
        size={firstSize}
        onSizeChanged={setFirstSize}
        first={<TestView backgroundColor="#ff3f34" />}
        second={
          <FrameDivider
            onSizeChanged={setSecondSize}
            size={secondSize}
            first={<TestView backgroundColor="#0fbcf9" />}
            second={<TestView backgroundColor="#05c46b" />}
          ></FrameDivider>
        }
        horizontal
      ></FrameDivider>
    </div>
  );
};

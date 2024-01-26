import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { CarouselIndicatorDot } from '@noodl-core-ui/components/layout/CarouselIndicatorDot';
import { Center } from '@noodl-core-ui/components/layout/Center';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize, TitleVariant } from '@noodl-core-ui/components/typography/Title';

// @ts-expect-error PNG import
import IMG_CarouselNodepickerPrefab from '../../../assets/images/carousel_nodepicker_prefab.png';
import { Carousel } from './Carousel';

interface NodePickerSliderProps {
  subtitle: string;
  title: string;
  text: string;
  action?: {
    label: string;
  };
}

function NodePickerSlider({ subtitle, title, text, action }: NodePickerSliderProps) {
  return (
    <>
      <Title isCentered variant={TitleVariant.Default}>
        {subtitle}
      </Title>
      <Title isCentered variant={TitleVariant.Highlighted} size={TitleSize.Large}>
        {title}
      </Title>
      <Box hasYSpacing>
        <Text isCentered>{text}</Text>
      </Box>
      {action && (
        <Center>
          <PrimaryButton
            label={action.label}
            size={PrimaryButtonSize.Small}
            variant={PrimaryButtonVariant.Ghost}
            hasBottomSpacing
          />
        </Center>
      )}
      <img src={IMG_CarouselNodepickerPrefab} />
    </>
  );
}

export default {
  title: 'Layout/Carousel',
  component: Carousel,
  argTypes: {}
} as ComponentMeta<typeof Carousel>;

const Template: ComponentStory<typeof Carousel> = (args) => (
  <div style={{ width: '430px' }}>
    <Carousel {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  items: [
    {
      slot: (
        <NodePickerSlider
          subtitle="New Feature"
          title="Introducing Prefabs"
          text="Import pre-made UI components (Prefabs) in to your project. Prefabs are build with core nodes and can easly be customized."
          action={{ label: 'Explore Prefabs' }}
        />
      )
    },
    {
      slot: (
        <NodePickerSlider
          subtitle="New Feature"
          title="Introducing Modules"
          text="Import modules in to your project. Modules are build with the SDK."
        />
      )
    },
    { slot: <>Test 2</> },
    { slot: <>Test 3</> }
  ],
  indicator: CarouselIndicatorDot
};

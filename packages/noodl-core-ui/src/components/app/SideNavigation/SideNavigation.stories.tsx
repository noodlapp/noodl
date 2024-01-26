import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';

import { SideNavigation, SideNavigationButton } from './SideNavigation';

export default {
  title: 'App/Side Navigation',
  component: SideNavigation,
  argTypes: {}
} as ComponentMeta<typeof SideNavigation>;

const Template: ComponentStory<typeof SideNavigation> = (args) => (
  <div style={{ width: '380px', height: '800px' }}>
    <SideNavigation {...args} />
  </div>
);

export const Common = Template.bind({});
Common.args = {
  toolbar: (
    <>
      <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ flex: '1' }}>
        <SideNavigationButton icon={IconName.Components} label={'Components'} />
        <SideNavigationButton icon={IconName.Search} label={'Search'} />
        <SideNavigationButton icon={IconName.Collaboration} label={'Collaboration'} />
        <SideNavigationButton icon={IconName.StructureCircle} label={'Version control'} notification={{ count: 2 }} />
        <SideNavigationButton icon={IconName.StructureCircle} label={'Version control'} notification={{ count: 100 }} />
        <SideNavigationButton icon={IconName.CloudData} label={'Cloud Services'} />
        <SideNavigationButton icon={IconName.CloudFunction} label={'Cloud functions'} />
        <SideNavigationButton icon={IconName.Setting} label={'Project settings'} />
      </Container>
      <Container direction={ContainerDirection.Vertical}>
        <SideNavigationButton icon={IconName.SlidersHorizontal} label={'Editor settings'} />
      </Container>
    </>
  ),
  panel: (
    <Container hasXSpacing hasYSpacing>
      <PrimaryButton label="Hello World" isGrowing />
    </Container>
  )
};

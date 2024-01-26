import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { ColorListView } from './ColorListView';

export default {
  title: 'Tree View/Color List View',
  component: ColorListView,
  argTypes: {}
} as ComponentMeta<typeof ColorListView>;

const Template: ComponentStory<typeof ColorListView> = (args) => <ColorListView {...args} />;

export const Common = Template.bind({});
Common.args = {
  items: [
    { id: 0, text: 'Grey - 200', color: '#F4F4F4' },
    { id: 1, text: 'Grey - 300', color: '#E9E9E9' },
    { id: 2, text: 'Grey - 700', color: '#4C4C4C' },
    { id: 3, text: 'Grey - 900', color: '#1F1F1F' },
    { id: 4, text: 'NDS - Error - 300', color: '#F4A196' },
    { id: 5, text: 'NDS - Error - 400', color: '#E8786B' },
    { id: 6, text: 'NDS - Error - 600', color: '#AF3F38' },
    { id: 7, text: 'NDS - Grey - 100', color: '#F6F6F6' },
    { id: 8, text: 'NDS - Grey - 1000', color: '#151414' },
    { id: 9, text: 'NDS - Grey - 200', color: '#D4D4D4' },
    { id: 10, text: 'NDS - Grey - 300', color: '#B8B8B8' },
    { id: 11, text: 'NDS - Grey - 400', color: '#9A9999' },
    { id: 12, text: 'NDS - Grey - 600', color: '#666565' },
    { id: 13, text: 'NDS - Grey - 700', color: '#504F4F' },
    { id: 14, text: 'NDS - Grey - 800', color: '#3C3C3C' },
    { id: 15, text: 'NDS - Grey - 900', color: '#292828' },
    { id: 16, text: 'NDS - Primary - 200', color: '#FCCC73' },
    { id: 17, text: 'NDS - Primary - 300', color: '#E5B034' },
    { id: 18, text: 'NDS - Secondary - 600', color: '#006C80' },
    { id: 19, text: 'NDS - Success - 600', color: '#007442' },
    { id: 20, text: 'Primary', color: '#5836F5' },
    { id: 21, text: 'Success', color: '#49AD7F' },
    { id: 22, text: 'White', color: '#FFFFFF' },
    { id: 23, text: 'Grey - 100', color: '#FBFBFB' },
    { id: 24, text: 'Grey - 400', color: '#CECECE' },
    { id: 25, text: 'NDS - Purple - 400', color: '#A98FBE' },
    { id: 26, text: 'NDS - Secondary - 300', color: '#8BC0CA' },
    { id: 27, text: 'Primary Light', color: '#F7F5FF' },
    { id: 28, text: 'Danger', color: '#F75A4F' },
    { id: 29, text: 'Grey - 500', color: '#A5A5A5' },
    { id: 30, text: 'Noodl Dark', color: '#171717' },
    { id: 31, text: 'Noodl Yellow', color: '#F5BC41' },
    { id: 32, text: 'Notice', color: '#F2C441' },
    { id: 33, text: 'Primary Dark', color: '#3F22B8' },
    { id: 34, text: 'Primary Subtle', color: '#C9BFFC' },
    { id: 35, text: 'Grey - 800', color: '#383838' },
    { id: 36, text: 'Grey - 600', color: '#757575' },
    { id: 37, text: 'Black', color: '#000000' }
  ]
};

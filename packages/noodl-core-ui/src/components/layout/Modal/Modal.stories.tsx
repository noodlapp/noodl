import React from 'react';

import { Modal } from '@noodl-core-ui/components/layout/Modal/Modal';

export default {
  title: 'Layout/Modal',
  argTypes: {}
};

const Template = (args) => (
  <div style={{ width: 280 }}>
    <Modal isVisible {...args}>
      Content in a Modal
    </Modal>
  </div>
);

export const Common = Template.bind({});

export const Header = Template.bind({});
Header.args = {
  strapline: 'strapline',
  title: 'title',
  subtitle: 'subtitle',
  hasHeaderDivider: true
};

export const Footer = Template.bind({});
Footer.args = {
  footerSlot: <>Content in Footer</>,
  hasFooterDivider: true
};

export const Full = Template.bind({});
Full.args = {
  strapline: 'strapline',
  title: 'title',
  subtitle: 'subtitle',
  hasHeaderDivider: true,
  footerSlot: <>Content in Footer</>,
  hasFooterDivider: true
};

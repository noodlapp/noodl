import { useState } from '@storybook/addons';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import React from 'react';

import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible/Collapsible';
import { Text } from '@noodl-core-ui/components/typography/Text';

export default {
  title: 'Layout/Collapsible',
  argTypes: {}
} as ComponentMeta<typeof Collapsible>;

const Template: ComponentStory<typeof Collapsible> = (args) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div style={{ width: 280 }}>
      <PrimaryButton
        variant={PrimaryButtonVariant.Muted}
        size={PrimaryButtonSize.Small}
        label="More info"
        onClick={() => setShowMore((prev) => !prev)}
        hasBottomSpacing
      />

      <Collapsible isCollapsed={showMore}>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec elit ante, imperdiet quis placerat nec, porta a
          erat. Nam dapibus dictum sagittis. Vivamus ut eros et sapien fringilla pretium a quis lectus. Donec suscipit,
          ipsum quis mollis varius, ante velit tempor augue, ac consequat risus massa eget sem. Aenean eu egestas lorem.
          Praesent quis justo dictum, consectetur enim nec, rutrum tortor. Donec elementum condimentum lacus ac
          pellentesque. Nam purus sem, fringilla finibus sapien a, ultrices aliquam ligula. Vestibulum dictum enim nec
          elit rhoncus, vel sodales ante condimentum. Pellentesque volutpat lectus eget ipsum vehicula, vel vestibulum
          metus fringilla. Nulla urna orci, fermentum non fermentum id, tempor sit amet ex. Quisque elit neque, tempor
          vel congue vehicula, hendrerit vitae metus. Maecenas dictum auctor neque in venenatis. Etiam faucibus eleifend
          urna, non tempor felis eleifend a. Suspendisse fermentum odio quis tristique gravida. Nulla facilisi.
        </Text>
      </Collapsible>
    </div>
  );
};

export const Common = Template.bind({});

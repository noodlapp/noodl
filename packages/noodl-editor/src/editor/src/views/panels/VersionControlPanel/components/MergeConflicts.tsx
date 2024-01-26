import React from 'react';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import { Container } from '@noodl-core-ui/components/layout/Container';
import { PrimaryButton, PrimaryButtonSize } from '@noodl-core-ui/components/inputs/PrimaryButton';

export function MergeConflicts() {
  return (
    <VStack>
      <Section hasVisibleOverflow hasGutter>
        <Container>
          <Icon icon={IconName.WarningTriangle} size={IconSize.Small} />
          <Box>
            <Label hasLeftSpacing variant={TextType.Shy}>
              Warning
            </Label>
            <Label hasLeftSpacing>Merge conflict</Label>
          </Box>
        </Container>
      </Section>
      <Section hasVisibleOverflow hasGutter>
        <Text hasBottomSpacing>
          You and your collaborators have made changes to the same nodes and you need to resolve them
        </Text>
        <PrimaryButton
          label="Open warnings"
          isGrowing
          size={PrimaryButtonSize.Small}
          onClick={() => {
            document.getElementById('editortopbar-warning-button').click();
          }}
        />
      </Section>
    </VStack>
  );
}

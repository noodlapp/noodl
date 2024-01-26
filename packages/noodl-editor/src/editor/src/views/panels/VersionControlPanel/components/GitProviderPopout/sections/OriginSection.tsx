import React from 'react';
import { GitProvider } from '@noodl/git';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { Container } from '@noodl-core-ui/components/layout/Container';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Text } from '@noodl-core-ui/components/typography/Text';

type OriginSectionProps = {
  provider: GitProvider;
  origin: string;
  onOriginChanged: (origin: string) => void;
};

export function OriginSection({ provider, origin, onOriginChanged }: OriginSectionProps) {
  return (
    <Section title="Git Origin" variant={SectionVariant.InModal} hasGutter>
      <TextInput
        hasBottomSpacing
        label="Git Origin"
        value={origin}
        variant={TextInputVariant.InModal}
        onChange={(ev) => onOriginChanged(ev.target.value)}
      />
      {provider === 'noodl' && (
        <Container hasBottomSpacing UNSAFE_style={{ alignItems: 'center', gap: '8px' }}>
          <Icon
            icon={IconName.WarningTriangle}
            size={IconSize.Default}
            variant={FeedbackType.Danger}
            UNSAFE_style={{ flexShrink: 0 }}
          />
          <Text>
            This project has a git origin set to a deprecated Noodl git hosting service. Please update to a different
            origin, such as GitHub.
          </Text>
        </Container>
      )}
    </Section>
  );
}

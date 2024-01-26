import React from 'react';

import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Text } from '@noodl-core-ui/components/typography/Text';

type GitConfigSectionProps = {
  gitConfigName: string;
  onUserNameChanged: (username: string) => void;
  gitConfigEmail: string;
  onUserEmailChanged: (email: string) => void;
};

export function GitConfigSection({
  gitConfigName,
  onUserNameChanged,
  gitConfigEmail,
  onUserEmailChanged
}: GitConfigSectionProps) {
  return (
    <Section title="Git Config Settings" variant={SectionVariant.InModal} hasGutter>
      <Text hasBottomSpacing>
        These are used as metadata for commits to help your collaborators understand who did a commit.
      </Text>
      <TextInput
        label="Name"
        value={gitConfigName}
        variant={TextInputVariant.InModal}
        hasBottomSpacing
        onChange={(ev) => onUserNameChanged(ev.target.value)}
      />
      <TextInput
        label="Email"
        value={gitConfigEmail}
        variant={TextInputVariant.InModal}
        onChange={(ev) => onUserEmailChanged(ev.target.value)}
      />
    </Section>
  );
}

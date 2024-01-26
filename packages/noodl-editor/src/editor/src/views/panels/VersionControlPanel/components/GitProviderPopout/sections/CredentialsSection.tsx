import React, { useState } from 'react';
import { GitProvider } from '@noodl/git';

import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Text } from '@noodl-core-ui/components/typography/Text';

type CredentialsSectionProps = {
  provider: GitProvider;
  username: string;
  password: string;
  onUserNameChanged: (username: string) => void;
  onPasswordChanged: (password: string) => void;
};

export function CredentialsSection({
  provider,
  username,
  password,
  onUserNameChanged,
  onPasswordChanged
}: CredentialsSectionProps) {
  const passwordLabel = provider === 'github' ? 'Personal Access Token' : 'Password';
  const showUsername = provider !== 'github';

  const [hidePassword, setHidePassword] = useState(true);

  return (
    <Section title={getTitle(provider)} variant={SectionVariant.InModal} hasGutter>
      {showUsername && (
        <TextInput
          hasBottomSpacing
          label="Username"
          value={username}
          variant={TextInputVariant.InModal}
          onChange={(ev) => onUserNameChanged(ev.target.value)}
        />
      )}
      <TextInput
        hasBottomSpacing
        label={passwordLabel}
        type={hidePassword ? 'password' : 'text'}
        value={password}
        variant={TextInputVariant.InModal}
        onChange={(ev) => onPasswordChanged(ev.target.value)}
        onFocus={() => setHidePassword(false)}
        onBlur={() => setHidePassword(true)}
      />

      <Text hasBottomSpacing>The credentials are saved encrypted locally per project.</Text>
      {provider === 'github' && !password?.length && (
        <a
          href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
          target="_blank"
          rel="noreferrer"
        >
          How to create a personal access token
        </a>
      )}
    </Section>
  );
}

function getTitle(provider: GitProvider) {
  if (provider === 'github') {
    return 'GitHub Credentials';
  }
  return 'Git Credentials';
}

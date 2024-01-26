import { GitStore } from '@noodl-store/GitStore';
import React, { useState, useEffect } from 'react';
import { Git } from '@noodl/git';
import { clearCredentialsCache } from '@noodl/git/src/core/trampoline/trampoline-askpass-handler';

import { ProjectModel } from '@noodl-models/projectmodel';

import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { ConditionalContainer } from '@noodl-core-ui/components/layout/ConditionalContainer';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';

import PopupLayer from '../../../../popuplayer';
import { CredentialsSection } from './sections/CredentialsSection';
import { GitConfigSection } from './sections/GitConfigSection';
import { OriginSection } from './sections/OriginSection';

export interface GitProviderPopoutProps {
  git: Git;
}

export function GitProviderPopout({ git }: GitProviderPopoutProps) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [gitConfigName, setGitConfigName] = useState('');
  const [gitConfigEmail, setGitConfigEmail] = useState('');

  const [gitOrigin, setGitOrigin] = useState(git.OriginUrl);

  //load start values
  useEffect(() => {
    async function getGitConfig() {
      const [config, name, email] = await Promise.all([
        GitStore.get(git.Provider, ProjectModel.instance.id),
        git.getConfigValue('user.name'),
        git.getConfigValue('user.email')
      ]);

      setUsername(config?.username);
      setPassword(config?.password);
      setGitConfigName(name);
      setGitConfigEmail(email);
      setLoading(false);
    }

    getGitConfig();
  }, []);

  const provider = git.getProviderForRemote(gitOrigin);

  useEffect(() => {
    async function getGitProviderConfig() {
      if (!provider) return;

      setLoading(true);
      const config = await GitStore.get(provider, ProjectModel.instance.id);

      setUsername(config?.username);
      setPassword(config?.password);
      setLoading(false);
    }

    getGitProviderConfig();
  }, [provider]);

  const hasRemote = provider !== 'none' && provider !== 'noodl'; //the deprecated noodl remote is not a valid remote anymore

  function onSubmit() {
    async function updateGitConfig() {
      if ((await git.getConfigValue('user.name')) !== gitConfigName) {
        git.setConfigValue('user.name', gitConfigName);
      }
      if ((await git.getConfigValue('user.email')) !== gitConfigEmail) {
        git.setConfigValue('user.email', gitConfigEmail);
      }
      if (git.OriginUrl !== gitOrigin) {
        git.setRemoteURL(gitOrigin);
      }
    }

    async function updateGitStore() {
      try {
        const config: { username?: string; password: string } = { password };

        if (provider !== 'github') {
          config.username = username;
        }

        await GitStore.set(provider, ProjectModel.instance.id, config);

        clearCredentialsCache();
      } catch (e) {
        console.log(e);
      }
    }

    setLoading(true);
    Promise.all([updateGitConfig(), updateGitStore()]).finally(() => {
      PopupLayer.instance.hidePopouts();
    });
  }

  return (
    <VStack UNSAFE_style={{ width: '400px' }}>
      <OriginSection provider={provider} origin={gitOrigin} onOriginChanged={setGitOrigin} />

      <ConditionalContainer doRenderWhen={!loading}>
        {hasRemote && (
          <CredentialsSection
            provider={provider}
            username={username}
            onUserNameChanged={setUsername}
            password={password}
            onPasswordChanged={setPassword}
          />
        )}
        <GitConfigSection
          gitConfigName={gitConfigName}
          onUserNameChanged={setGitConfigName}
          gitConfigEmail={gitConfigEmail}
          onUserEmailChanged={setGitConfigEmail}
        />
        <Section variant={SectionVariant.InModal} hasGutter>
          <PrimaryButton label="Save" onClick={onSubmit} />
        </Section>
      </ConditionalContainer>
    </VStack>
  );
}

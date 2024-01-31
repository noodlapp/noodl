import { AiModel, AiVersion, OpenAiStore } from '@noodl-store/AiAssistantStore';
import React, { useState } from 'react';
import { platform } from '@noodl/platform';

import { verifyOpenAiApiKey } from '@noodl-models/AiAssistant/api';

import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { PropertyPanelButton } from '@noodl-core-ui/components/property-panel/PropertyPanelButton';
import { PropertyPanelRow } from '@noodl-core-ui/components/property-panel/PropertyPanelInput';
import { PropertyPanelPasswordInput } from '@noodl-core-ui/components/property-panel/PropertyPanelPasswordInput';
import { PropertyPanelSelectInput } from '@noodl-core-ui/components/property-panel/PropertyPanelSelectInput';
import { PropertyPanelTextInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextInput';
import { CollapsableSection } from '@noodl-core-ui/components/sidebar/CollapsableSection';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize } from '@noodl-core-ui/components/typography/Title';

import { ToastLayer } from '../../../ToastLayer/ToastLayer';

export const AI_ASSISTANT_ENABLED_SUGGESTIONS_KEY = 'aiAssistant.enabledSuggestions';

export function OpenAiSection() {
  const [enabledState, setEnabledState] = useState<AiVersion>(OpenAiStore.getVersion());
  const [apiKey, setApiKey] = useState(OpenAiStore.getApiKey());
  const [endpoint, setEndpoint] = useState(OpenAiStore.getEndpoint());
  const [model, setModel] = useState<AiModel>(OpenAiStore.getModel());

  async function onVerifyApiKey() {
    const models = await verifyOpenAiApiKey(apiKey);
    if (models) {
      const haveGpt4 = !!models['gpt-4'];
      if (haveGpt4) {
        OpenAiStore.setIsAiApiKeyVerified(true);
        ToastLayer.showSuccess('OpenAI API Key is valid with GPT-4!');
      } else {
        OpenAiStore.setIsAiApiKeyVerified(false);
        ToastLayer.showError('OpenAI API Key is missing gpt-4 model Support!');
      }
    } else {
      OpenAiStore.setIsAiApiKeyVerified(false);
      ToastLayer.showError('OpenAI API Key is invalid!');
    }
  }

  return (
    <CollapsableSection title="Noodl AI (Beta)">
      <Box hasXSpacing>
        <VStack>
          <PropertyPanelRow label="Version" isChanged={false}>
            <PropertyPanelSelectInput
              value={enabledState}
              properties={{
                options: [
                  { label: 'Disabled', value: 'disabled' },
                  { label: 'OpenAI', value: 'full-beta' },
                  { label: 'Custom', value: 'enterprise' }
                ]
              }}
              onChange={(value: AiVersion) => {
                setEnabledState(value);
                OpenAiStore.setVersion(value);
              }}
            />
          </PropertyPanelRow>

          {enabledState === 'disabled' && (
            <Box hasYSpacing>
              <Text>Noodl AI is currently disabled.</Text>
            </Box>
          )}

          {enabledState === 'full-beta' && (
            <>
              <PropertyPanelRow label="Model" isChanged={false}>
                <PropertyPanelSelectInput
                  value={model}
                  properties={{
                    options: [
                      { label: 'gpt-3', value: 'gpt-3' },
                      { label: 'gpt-4', value: 'gpt-4' }
                    ]
                  }}
                  onChange={(value: AiModel) => {
                    setModel(value);
                    OpenAiStore.setModel(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="API Key" isChanged={false}>
                <PropertyPanelPasswordInput
                  value={apiKey}
                  onChange={(value) => {
                    setApiKey(value);
                    OpenAiStore.setApiKey(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="API Key" isChanged={false}>
                <PropertyPanelButton
                  properties={{
                    isPrimary: true,
                    buttonLabel: 'Verify API Key',
                    onClick() {
                      onVerifyApiKey();
                    }
                  }}
                />
              </PropertyPanelRow>
              <Box hasYSpacing>
                <Text>Verify your OpenAI API key to start using AI Commands.</Text>
              </Box>
            </>
          )}

          {enabledState === 'enterprise' && (
            <>
              <PropertyPanelRow label="Model" isChanged={false}>
                <PropertyPanelSelectInput
                  value={model}
                  properties={{
                    options: [
                      { label: 'gpt-3', value: 'gpt-3' },
                      { label: 'gpt-4', value: 'gpt-4' }
                    ]
                  }}
                  onChange={(value: AiModel) => {
                    setModel(value);
                    OpenAiStore.setModel(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="API Key" isChanged={false}>
                <PropertyPanelPasswordInput
                  value={apiKey}
                  onChange={(value) => {
                    setApiKey(value);
                    OpenAiStore.setApiKey(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="Endpoint" isChanged={false}>
                <PropertyPanelTextInput
                  value={endpoint}
                  onChange={(value) => {
                    setEndpoint(value);
                    OpenAiStore.setEndpoint(value);
                  }}
                />
              </PropertyPanelRow>
            </>
          )}

          <Box
            hasXSpacing={3}
            hasYSpacing={3}
            UNSAFE_style={{ borderRadius: '2px', background: 'var(--theme-color-bg-3)' }}
          >
            <Title size={TitleSize.Medium} hasBottomSpacing>
              Noodl AI docs
            </Title>
            <Text hasBottomSpacing>See setup instructions and guides for how to use Noodl AI on our docs.</Text>
            <PrimaryButton
              variant={PrimaryButtonVariant.Muted}
              size={PrimaryButtonSize.Small}
              isGrowing
              label="Open docs"
              onClick={() => {
                platform.openExternal('https://docs.noodl.net/#/docs/getting-started/noodl-ai/');
              }}
            />
          </Box>
        </VStack>
      </Box>
    </CollapsableSection>
  );
}

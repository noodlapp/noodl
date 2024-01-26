import { useModernModel } from '@noodl-hooks/useModel';
import React, { useState } from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';
import { CloudService } from '@noodl-models/CloudServices';
import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';

import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import Modal from '@noodl-core-ui/components/layout/Modal/Modal';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';

import { ToastType } from '../../../ToastLayer/components/ToastCard';
import { useCloudServiceContext } from '../CloudServicePanel.context';

function isValidParseUrl(url: string) {
  if (!url) return false;

  if (!url.toLowerCase().startsWith('http')) {
    url = 'http://' + url;
  }

  try {
    new URL(url);

    if (url.endsWith('/') || url.endsWith('\\')) {
      return 'Invalid Url, remove the slash from the end';
    }

    return undefined;
  } catch (err) {
    return 'Invalid Url';
  }
}

export interface CloudServiceCreateModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function CloudServiceCreateModal({ isVisible, onClose }: CloudServiceCreateModalProps) {
  const { runActivity } = useCloudServiceContext();

  const cloudService = useModernModel(CloudService.instance);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [masterKey, setMasterKey] = useState('');

  // Fields required for External
  const [endpoint, setEndpoint] = useState('');
  const isEndpointValid = isValidParseUrl(endpoint);

  const [appId, setAppId] = useState('');

  function clearForm() {
    setName('');
    setDescription('');
    setEndpoint('');
    setAppId('');
    setMasterKey('');
  }

  async function onCreate() {
    await runActivity('Creating Cloud Service...', async () => {
      await cloudService.backend.create({
        name,
        description,
        masterKey: masterKey ? masterKey : undefined,
        appId: appId ? appId : undefined,
        url: endpoint ? endpoint : undefined
      });

      clearForm();
      onClose();

      return {
        type: ToastType.Success,
        message: 'Cloud Service created!'
      };
    });
  }

  function isCloudServiceCreationAllowed() {
    if (!name) return false;
    if (!endpoint || !appId) return false;
    return true;
  }

  const externalGuideUrl = getDocsEndpoint() + '/docs/guides/deploy/using-an-external-backend';

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="Add new cloud service">
      <>
        <Text hasBottomSpacing textType={TextType.DefaultContrast}>
          Each cloud service is isolated. This allows you to create separate ones for development, testing and
          production, or for different locales.
        </Text>

        <Text hasBottomSpacing textType={TextType.DefaultContrast}>
          For a cloud service to be compatible with the Noodl Cloud Functions you need to use our image. Read more about
          self hosting cloud services{' '}
          <a target="_blank" href={externalGuideUrl} rel="noreferrer">
            here
          </a>
          .
        </Text>

        <div style={{ textAlign: 'right' }}>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
            <Text hasBottomSpacing textType={TextType.DefaultContrast}>
              Noodl backends are self hosted. Refer to to{' '}
              <a href={externalGuideUrl} target="_blank" rel="noreferrer">
                this guide
              </a>{' '}
              to learn more.
            </Text>
          </div>

          <TextInput
            label="Name"
            value={name}
            variant={TextInputVariant.InModal}
            onChange={(e) => setName(e.target.value)}
            testId="new-cloud-service-name-input"
            hasBottomSpacing
          />

          <TextInput
            label="Description (optional)"
            value={description}
            variant={TextInputVariant.InModal}
            onChange={(e) => setDescription(e.target.value)}
            hasBottomSpacing
          />

          <div>
            <TextInput
              label="Endpoint"
              value={endpoint}
              notification={
                isEndpointValid
                  ? {
                      type: FeedbackType.Notice,
                      message: isEndpointValid
                    }
                  : undefined
              }
              variant={TextInputVariant.InModal}
              onChange={(e) => setEndpoint(e.target.value)}
              hasBottomSpacing
            />

            <TextInput
              label="Application ID"
              value={appId}
              variant={TextInputVariant.InModal}
              onChange={(e) => setAppId(e.target.value)}
              hasBottomSpacing
            />
          </div>

          <TextInput
            label="Master key (encrypted and only stored on your computer)"
            value={masterKey}
            variant={TextInputVariant.InModal}
            onChange={(e) => setMasterKey(e.target.value)}
          />

          <Text textType={TextType.DefaultContrast} hasBottomSpacing style={{ textAlign: 'left' }}>
            Can't be used as editor backend if left blank
          </Text>

          <PrimaryButton
            onClick={() => onCreate()}
            label="Create new cloud service"
            isDisabled={!isCloudServiceCreationAllowed()}
            testId="create-new-cloud-service-button"
          />
        </div>
      </>
    </Modal>
  );
}

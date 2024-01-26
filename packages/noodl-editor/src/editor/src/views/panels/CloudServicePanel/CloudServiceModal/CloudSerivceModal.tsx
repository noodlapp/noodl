import React, { useEffect, useState } from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';
import { CloudService, Environment } from '@noodl-models/CloudServices';

import { TextButton } from '@noodl-core-ui/components/inputs/TextButton';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Columns } from '@noodl-core-ui/components/layout/Columns';
import { Modal } from '@noodl-core-ui/components/layout/Modal/Modal';
import { HStack, VStack } from '@noodl-core-ui/components/layout/Stack';
import { Text } from '@noodl-core-ui/components/typography/Text';

import { ToastLayer } from '../../../ToastLayer';

export interface CloudServiceModalProps {
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;

  isActive: boolean;
  environment: Environment;

  onDeleteClick?: () => void;
  onArchiveClick?: () => void;
  onRestoreClick?: () => void;
  onSetEditorClick?: (id: Environment['id']) => void;
  onUnsetEditorClick?: () => void;
}

export function CloudServiceModal(props: CloudServiceModalProps) {
  return <AsSelfHosted {...props} />;
}

function AsSelfHosted({
  isVisible,
  setIsVisible,
  isActive,
  environment,
  onUnsetEditorClick,
  onDeleteClick,
  onSetEditorClick
}: CloudServiceModalProps) {
  const [name, setName] = useState(environment.name);
  const [description, setDescription] = useState(environment.description);
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [masterKey, setMasterKey] = useState(environment.masterKey);

  function update() {
    CloudService.instance.backend
      .update({
        id: environment.id,
        name,
        description,
        masterKey
      })
      .then(() => {
        ToastLayer.showSuccess(`Updated Cloud Service`);
        CloudService.instance.backend.fetch();
      })
      .catch(() => {
        ToastLayer.showError(`Failed to update Cloud Service`);
      });
  }

  return (
    <Modal title="Manage self hosted cloud service" isVisible={isVisible} onClose={() => setIsVisible(false)}>
      <Box hasBottomSpacing>
        <VStack hasSpacing>
          <TextInput
            value={name}
            variant={TextInputVariant.InModal}
            label="Name"
            onChange={(e) => setName(e.target.value)}
            onBlur={update}
            onEnter={update}
          />

          <TextInput
            value={description}
            variant={TextInputVariant.InModal}
            label="Description"
            onChange={(e) => setDescription(e.target.value)}
            onBlur={update}
            onEnter={update}
          />

          <Columns hasXGap={4} layoutString="1 1">
            <TextInput
              value={environment.appId}
              variant={TextInputVariant.InModal}
              label="App Id"
              isReadonly
              isCopyable
              UNSAFE_style={{ flex: 1 }}
            />
            <VStack>
              <TextInput
                value={masterKey}
                variant={TextInputVariant.InModal}
                label="Master key"
                type={showMasterKey ? 'text' : 'password'}
                notification={!masterKey ? { type: FeedbackType.Danger } : undefined}
                onChange={(e) => setMasterKey(e.target.value)}
                UNSAFE_style={{ flex: 1 }}
                onFocus={() => {
                  setShowMasterKey(true);
                }}
                onBlur={() => {
                  setShowMasterKey(false);
                  update();
                }}
                onEnter={update}
              />
              {!masterKey && (
                <Box hasTopSpacing={2}>
                  <Text textType={FeedbackType.Danger}>
                    Missing Master Key, enter the Master Key to be able to use this Cloud Service in the editor.
                  </Text>
                </Box>
              )}
              <Box hasTopSpacing={2}>
                <Text>The Master Key is saved locally in an encrypted file.</Text>
              </Box>
            </VStack>
          </Columns>

          <TextInput
            value={environment.url}
            variant={TextInputVariant.InModal}
            label="Endpoint"
            isReadonly
            isCopyable
          />
        </VStack>
      </Box>

      {isActive ? (
        <TextButton label="Use editor without backend" onClick={onUnsetEditorClick} />
      ) : (
        <HStack hasSpacing={2}>
          <TextButton label="Unlink service" onClick={onDeleteClick} variant={FeedbackType.Danger} />
          <TextButton
            label="Use in editor"
            onClick={() => {
              // A lil' ugly hack to trigger the overlay
              setTimeout(() => {
                onSetEditorClick && onSetEditorClick(environment.id);
              }, 10);
            }}
          />
        </HStack>
      )}
    </Modal>
  );
}

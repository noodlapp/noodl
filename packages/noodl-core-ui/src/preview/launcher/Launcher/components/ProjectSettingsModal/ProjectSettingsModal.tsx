import React, { useState } from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { Card, CardBackground } from '@noodl-core-ui/components/common/Card';
import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextButton } from '@noodl-core-ui/components/inputs/TextButton';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Columns } from '@noodl-core-ui/components/layout/Columns';
import { Modal, ModalProps } from '@noodl-core-ui/components/layout/Modal';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Title } from '@noodl-core-ui/components/typography/Title';
import {
  CloudSyncType,
  LauncherProjectData
} from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherProjectCard';

interface ProjectSettingsModalProps {
  projectData?: LauncherProjectData;
  isVisible: ModalProps['isVisible'];
  onClose: ModalProps['onClose'];
}

export function ProjectSettingsModal({ isVisible, projectData, onClose }: ProjectSettingsModalProps) {
  const [newProjectName, setNewProjectName] = useState(projectData?.title);
  const [gitUrl, setGitUrl] = useState('');

  const [SaveDialog, confirmSaveProjectData] = useConfirmationDialog({
    title: 'Please confirm',
    message: 'Are you sure you want to update the project settings?'
  });

  const [RemoveDialog, confirmRemoveWorkspaceProject] = useConfirmationDialog({
    title: 'Please confirm',
    message: 'Are you sure you want to remove the project?',
    isDangerousAction: true
  });

  if (!projectData) return null;

  function onPersistUpdatedData() {
    confirmSaveProjectData()
      .then(() => {
        alert('FIXME: take all new values and persist them');
      })
      .catch(() => console.log('Save cancelled'));
  }

  function onPushToExternalGitRepo() {
    alert('FIXME: Push to an external Git repo');
  }

  function onUnsyncProjectFromGit() {
    alert('FIXME: Reset .git folder in project');
  }

  function onRemoveProject() {
    confirmRemoveWorkspaceProject()
      .then(() => {
        alert('FIXME: Remove project');
      })
      .catch(() => {
        console.log('Project removal cancelled');
      });
  }

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="Project settings"
      subtitle={projectData.title}
      footerSlot={
        <Box hasBottomSpacing UNSAFE_style={{ width: '100%' }}>
          <HStack hasSpacing UNSAFE_style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <TextButton
              label="Remove project"
              icon={IconName.Trash}
              variant={FeedbackType.Danger}
              onClick={onRemoveProject}
            />

            <HStack hasSpacing>
              <PrimaryButton label="Cancel" onClick={onClose} variant={PrimaryButtonVariant.Muted} />
              <PrimaryButton label="Save changes" onClick={onPersistUpdatedData} />
            </HStack>
          </HStack>
        </Box>
      }
    >
      <SaveDialog />
      <RemoveDialog />

      <Columns hasXGap>
        <TextInput
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.currentTarget.value)}
          variant={TextInputVariant.InModal}
          label="Project name"
        />

        <TextInput
          value={projectData.localPath}
          variant={TextInputVariant.InModal}
          label="Project folder path"
          isReadonly
          isCopyable
        />
      </Columns>

      {projectData.cloudSyncMeta.type === CloudSyncType.None && (
        <>
          <Box hasTopSpacing>
            <Card background={CardBackground.Bg2}>
              <Title hasBottomSpacing>This project is local only.</Title>
              <Text>
                Please create a Git repository in your preferred Git provider, and push the repository to enable
                collaboration and version control for this project.
              </Text>

              <HStack hasSpacing>
                <TextInput
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.currentTarget.value)}
                  label="Git repo URL"
                  UNSAFE_style={{ paddingTop: 16 }}
                />

                <div style={{ alignSelf: 'flex-end' }}>
                  <PrimaryButton label="Push project to Git" onClick={() => onPushToExternalGitRepo()} />
                </div>
              </HStack>
            </Card>
          </Box>
        </>
      )}

      {projectData.cloudSyncMeta.type === CloudSyncType.Git && (
        <Box hasTopSpacing>
          <Card background={CardBackground.Bg2}>
            <Title hasBottomSpacing>Project is synced to a Git repo</Title>
            <Text hasBottomSpacing>
              Versioning and branching can be managed inside of the Noodl editor. User access has to be managed with
              your Git provider.
            </Text>

            <HStack hasSpacing>
              <TextInput
                value={projectData.cloudSyncMeta.source}
                label="Current Git repository URL"
                isReadonly
                isCopyable
              />

              <div style={{ alignSelf: 'flex-end' }}>
                <PrimaryButton
                  label="Unsync project instance from Git"
                  onClick={() => onUnsyncProjectFromGit()}
                  variant={PrimaryButtonVariant.Danger}
                />
              </div>
            </HStack>
          </Card>
        </Box>
      )}
    </Modal>
  );
}

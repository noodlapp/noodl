import React, { useState } from 'react';
import { GitActionError } from '@noodl/git';
import { createStashEntry } from '@noodl/git/src/core/stash';

import { ProjectModel } from '@noodl-models/projectmodel';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextArea } from '@noodl-core-ui/components/inputs/TextArea';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { ScrollArea } from '@noodl-core-ui/components/layout/ScrollArea';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';
import { ContextMenu } from '@noodl-core-ui/components/popups/ContextMenu';
import { Label } from '@noodl-core-ui/components/typography/Label';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';
import { useVersionControlContext } from '../context';
import { LocalChangesDiff } from './LocalChangesDiff';
import { Stashes } from './Stashes';

export interface LocalChangesProps {
  hasConflictsInProject: boolean;
}

export function LocalChanges({ hasConflictsInProject }: LocalChangesProps) {
  const {
    git,
    repositoryPath,
    setActiveTabId,
    setSelectedCommit,
    setIsPerformingAction,
    localChangesCount,
    localDiff,
    fetch
  } = useVersionControlContext();
  const { gitStatus, branches, currentBranch, fetchLocal } = fetch;

  const canInteract = gitStatus.kind !== 'fetch';
  const hasChanges = localChangesCount > 0;

  const [commitMessage, setCommitMessage] = useState('');

  const [ResetDialog, confirmReset] = useConfirmationDialog({
    title: 'Confirm Reset',
    message: 'Are you sure you want to reset all your local changes? This action can not be undone.',
    confirmButtonLabel: 'Yes, reset',
    isDangerousAction: true
  });

  const [StashDialog, showStashDialog] = useConfirmationDialog({
    title: 'Confirm Stash',
    message: 'Do you want to stash your local changes?',
    confirmButtonLabel: 'Yes, stash'
  });

  const canCommit = canInteract && hasChanges;

  async function onCommit() {
    setIsPerformingAction(true);
    ToastLayer.showActivity('Commiting local changes', 'performing-action');

    try {
      // Create the commit
      const commitSha = await git.commit(commitMessage);
      setCommitMessage('');

      // Update local status
      await fetchLocal();

      // Select the history tab
      setActiveTabId('history');

      // Select the new commit
      if (commitSha) {
        setSelectedCommit(commitSha);
      }
    } catch (error) {
      if (error instanceof GitActionError) {
        ToastLayer.showError(error.message);
      } else {
        console.error(error);
        ToastLayer.showError('Failed to commit. Error: ' + error);
      }
    }

    ToastLayer.hideActivity('performing-action');
    setIsPerformingAction(false);
  }

  function onResetAllChanges() {
    confirmReset().then(async () => {
      setIsPerformingAction(true);
      ToastLayer.showActivity('Resetting local changes', 'performing-action');

      try {
        ProjectModel.setSaveOnModelChange(false);
        // TODO: remoteHasBranch ?
        const remoteHasBranch = branches.some((b) => b.name === currentBranch?.name && !!b.remoteName);

        if (remoteHasBranch) {
          await git.resetToMergeBase();
        } else {
          await git.resetToHead();
        }

        // TODO: Require delay?
        await fetchLocal();

        //note: the projectChangedOnDisk listener will enable ProjectModel.setSaveOnModelChange when it's done
        EventDispatcher.instance.notifyListeners('projectChangedOnDisk');
        ToastLayer.showSuccess('Reset done');
      } catch (e) {
        ProjectModel.setSaveOnModelChange(true);

        if (e instanceof GitActionError) {
          ToastLayer.showError(e.message);
        } else {
          ToastLayer.showError('Reset failed. ' + e.toString());
        }
      }

      ToastLayer.hideActivity('performing-action');
      setIsPerformingAction(false);
    });
  }

  function onStashLocalChanges() {
    showStashDialog()
      .then(async () => {
        ProjectModel.setSaveOnModelChange(false);
        const stashMessage = fetch.createStashMessage();
        await createStashEntry(repositoryPath, stashMessage);

        EventDispatcher.instance.notifyListeners('projectChangedOnDisk'); //note: automatically enables project saving again when the project has been reloaded

        await fetch.fetchLocal();
      })
      .catch((_) => {});
  }

  return (
    <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ height: '100%' }}>
      <ResetDialog />
      <StashDialog />

      <Container direction={ContainerDirection.Vertical} hasXSpacing hasYSpacing>
        {!hasConflictsInProject && (
          <>
            <Label hasBottomSpacing>Please write a commit message</Label>
            <TextArea
              value={commitMessage}
              onChange={(ev) => setCommitMessage(ev.target.value)}
              placeholder="Describe your changes"
              hasBottomSpacing
            />
          </>
        )}

        <HStack>
          <PrimaryButton
            label="Commit local changes"
            size={PrimaryButtonSize.Small}
            isDisabled={!canCommit || hasConflictsInProject}
            isGrowing
            hasRightSpacing
            onClick={onCommit}
          />
          <ContextMenu
            size={IconSize.Large}
            menuItems={[
              {
                label: 'Stash local changes',
                onClick: onStashLocalChanges,
                icon: IconName.Stash,
                isDisabled: !hasChanges || hasConflictsInProject
              },
              'divider',
              {
                label: 'Delete local changes',
                onClick: onResetAllChanges,
                isDangerous: true,
                icon: IconName.Trash,
                isDisabled: !hasChanges
              }
            ]}
          />
        </HStack>
      </Container>

      <ScrollArea UNSAFE_style={{ width: '100%', minHeight: 81 }}>
        {hasChanges || !localDiff ? (
          <LocalChangesDiff />
        ) : (
          <Container direction={ContainerDirection.Vertical} hasXSpacing hasYSpacing>
            <Label>You have no local changes</Label>
          </Container>
        )}
      </ScrollArea>

      <Stashes />
    </Container>
  );
}

import React, { useEffect, useState } from 'react';
import { getCommit } from '@noodl/git/src/core/logs';
import { merge } from '@noodl/git/src/core/merge';
import { Commit } from '@noodl/git/src/core/models/snapshot';
import { GitResetMode, reset } from '@noodl/git/src/core/reset';

import { ProjectModel } from '@noodl-models/projectmodel';

import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextArea } from '@noodl-core-ui/components/inputs/TextArea';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { ScrollArea } from '@noodl-core-ui/components/layout/ScrollArea';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';
import { Text } from '@noodl-core-ui/components/typography/Text';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';
import { useVersionControlContext } from '../context';
import { CommitChangesDiff } from './CommitChangesDiff';

export function BranchMerge() {
  return (
    <ScrollArea>
      <VStack>
        <BranchMergeChanges />
      </VStack>
    </ScrollArea>
  );
}

function BranchMergeChanges() {
  const [commitMessage, setCommitMessage] = useState('');
  const { repositoryPath, fetch, branchStatus, localChangesCount, setBranchStatus } = useVersionControlContext();
  const { currentBranch, fetchLocal } = fetch;
  const [ourCommit, setOurCommit] = useState<Commit>(null);

  const [HasLocalChangesDialog, showHasLocalChangesDialog] = useConfirmationDialog({
    isCancelButtonHidden: true,
    title: 'Merge',
    message: "Can't merge to a branch with local changes. Commit or stash your changes before merging.",
    confirmButtonLabel: 'OK'
  });

  useEffect(() => {
    (async () => {
      const ourCommit = await getCommit(repositoryPath, fetch.currentCommitSha);
      setOurCommit(ourCommit);
    })();
  }, [fetch.currentCommitSha]);

  function onMergeBranches() {
    if (localChangesCount > 0) {
      showHasLocalChangesDialog();
      return;
    }

    async function doMerge() {
      const activityId = 'branch-merge';
      ToastLayer.showActivity(`Merging ${currentBranch.name} with ${branchStatus.to.nameWithoutRemote}`, activityId);
      try {
        //localChangesCount is zero but we might have some minor metadata changes, reset them before merging

        ProjectModel.setSaveOnModelChange(false);
        await reset(repositoryPath, GitResetMode.Hard, 'HEAD');

        await merge(repositoryPath, branchStatus.to.nameWithoutRemote, {
          message: commitMessage,
          strategy: 'recursive',
          strategyOption: 'ours'
        });

        setBranchStatus(null);

        EventDispatcher.instance.notifyListeners('projectChangedOnDisk');

        await fetchLocal();
      } catch (e) {
        ToastLayer.showError(e.message || e.result?.output?.toString());
      }
      ToastLayer.hideActivity(activityId);

      ProjectModel.setSaveOnModelChange(true);
    }

    doMerge();
  }

  return (
    <>
      <HasLocalChangesDialog />
      <Container direction={ContainerDirection.Vertical} hasXSpacing hasYSpacing>
        <Text hasBottomSpacing>Please write a merge message.</Text>
        <TextArea
          value={commitMessage}
          onChange={(ev) => setCommitMessage(ev.target.value)}
          placeholder="Describe changes"
          hasBottomSpacing
        />
        <PrimaryButton label="Merge branches" onClick={onMergeBranches} />
      </Container>

      <CommitChangesDiff commit={ourCommit} kind="merge" refToDiffTo={branchStatus.to.tip.sha} />
    </>
  );
}

import React from 'react';
import { Commit } from '@noodl/git/src/core/models/snapshot';
import { GitResetMode, reset } from '@noodl/git/src/core/reset';

import { ProjectModel } from '@noodl-models/projectmodel';
import { copyValueToClipboard } from '@noodl-utils/copyValueToClipboard';

import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';
import { ContextMenu } from '@noodl-core-ui/components/popups/ContextMenu';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';
import { useVersionControlContext } from '../context';
import { CommitChangesDiff } from './CommitChangesDiff';
import { convertGitRemoteUrlToCommitUrl } from '../github';
import { platform } from '@noodl/platform';

export interface HistoryCommitDiffProps {
  commit: Commit;
}

export function HistoryCommitDiff({ commit }: HistoryCommitDiffProps) {
  const { git, repositoryPath, localChangesCount, fetch } = useVersionControlContext();

  const [HaveLocalChangesDialog, showHaveLocalChangesDialog] = useConfirmationDialog({
    isCancelButtonHidden: true,
    title: 'Reset to commit',
    message: "Can't reset to this commit when you have local changes. Commit or stash your changes before applying.",
    confirmButtonLabel: 'OK'
  });

  const [HaveLocalCommitsDialog, showHaveLocalCommitsDialog] = useConfirmationDialog({
    title: 'Reset to commit',
    message: 'You have local commits that might be deleted by this operation. Are you sure you want to contine?',
    confirmButtonLabel: 'Yes, reset'
  });

  async function performResetToCommit() {
    ProjectModel.setSaveOnModelChange(false);
    await reset(repositoryPath, GitResetMode.Hard, commit.sha);
    EventDispatcher.instance.notifyListeners('projectChangedOnDisk');
    await fetch.fetchLocal();
    ToastLayer.showSuccess('Resetted to commit #' + commit.shortSha);
  }

  function resetToCommit() {
    if (localChangesCount > 0) {
      showHaveLocalChangesDialog();
    } else if (fetch.localCommitCount > 0) {
      showHaveLocalCommitsDialog().then(performResetToCommit);
    } else {
      performResetToCommit();
    }
  }

  return (
    <Section
      title={`Commit changes (#${commit.shortSha})`}
      variant={SectionVariant.Panel}
      UNSAFE_style={{ flex: '1' }}
      actions={
        <ContextMenu
          menuItems={[
            {
              label: 'Reset to this commit',
              onClick: resetToCommit
            },
            'divider',
            {
              label: 'Copy SHA',
              onClick: () =>
                copyValueToClipboard({
                  value: commit.sha
                })
            },
            git.Provider === 'github' && {
              label: 'View on GitHub',
              onClick: () => {
                const commitLink = convertGitRemoteUrlToCommitUrl(git.OriginUrl, commit.sha);
                platform.openExternal(commitLink);
              }
            }
          ]}
        />
      }
    >
      <HaveLocalChangesDialog />
      <HaveLocalCommitsDialog />

      <CommitChangesDiff commit={commit} kind="parent" />
    </Section>
  );
}

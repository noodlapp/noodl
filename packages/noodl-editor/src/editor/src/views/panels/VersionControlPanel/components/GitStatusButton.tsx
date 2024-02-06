import React, { useEffect, useState } from 'react';
import { getRemote, push, pull, GitActionError, GitActionErrorCode } from '@noodl/git';
import { merge } from '@noodl/git/src/core/merge';
import { Stash } from '@noodl/git/src/core/models/snapshot';
import { createStashEntry, popStashEntry, popStashEntryToBranch } from '@noodl/git/src/core/stash';

import { ProjectModel } from '@noodl-models/projectmodel';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { ActionButton, ActionButtonProps, ActionButtonVariant } from '@noodl-core-ui/components/inputs/ActionButton';
import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';
import { useVersionControlContext } from '../context';

export type GitStatusButtonProps = {
  openGitSettingsPopout: () => void;
};

export function GitStatusButton({ openGitSettingsPopout }: GitStatusButtonProps) {
  const { git, repositoryPath, localChangesCount, fetch } = useVersionControlContext();

  const [StashBeforePullDialog, showStashBeforePullDialog] = useConfirmationDialog({
    message: 'You have local changes. Do you want to pull and merge your local changes?',
    confirmButtonLabel: 'Yes'
  });

  const {
    gitStatus,
    setGitStatus,
    currentBranch,
    lastFetchTime,
    localCommitCount,
    remoteCommitCount,
    fetchRemote,
    fetchLocal
  } = fetch;

  const [lastUpdate, setLastUpdate] = useState(undefined);

  useEffect(() => {
    if (lastFetchTime) {
      const date = new Date(lastFetchTime);
      const text = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      setLastUpdate(text);
    }
  }, [lastFetchTime]);

  function lastUpdateText() {
    return lastUpdate ? `Last updated ${lastUpdate}` : 'Fetching...';
  }

  const props = (function (): ActionButtonProps {
    switch (gitStatus.kind) {
      case 'default':
        return {
          icon: IconName.Refresh,
          label: 'Up to date',
          affixText: lastUpdateText()
        };

      case 'error':
        return {
          icon: IconName.Refresh,
          label: 'Failed',
          affixText: gitStatus.message
        };

      case 'error-fetch':
        return {
          icon: IconName.Refresh,
          label: 'Failed to update',
          affixText: gitStatus.message
        };

      case 'fetch': {
        if (typeof gitStatus.progress === 'number') {
          return {
            icon: IconName.ArrowDown,
            isDisabled: true,
            variant: ActionButtonVariant.Background,
            label: 'Receiving Updates...',
            affixText: `${Math.ceil(gitStatus.progress * 100)}%`
          };
        } else {
          return {
            icon: IconName.Refresh,
            isDisabled: true,
            variant: ActionButtonVariant.Background,
            label: 'Checking for updates...',
            affixText: lastUpdateText()
          };
        }
      }

      case 'pull': {
        if (typeof gitStatus.progress === 'number') {
          return {
            icon: IconName.ArrowDown,
            isDisabled: true,
            variant: ActionButtonVariant.BackgroundAction,
            label: 'Pull in progress...',
            affixText: `${gitStatus.message}: ${Math.ceil(gitStatus.progress * 100)}%`
          };
        } else {
          return {
            icon: IconName.ArrowDown,
            variant: ActionButtonVariant.CallToAction,
            label: remoteCommitCount === 1 ? `Pull 1 remote commit` : `Pull ${remoteCommitCount} remote commits`,
            affixText: lastUpdateText()
          };
        }
      }

      case 'push-repository': {
        return {
          icon: IconName.Setting,
          variant: ActionButtonVariant.Background,
          label: 'No remote set',
          affixText: 'To push changes set a git remote'
        };
      }

      case 'push': {
        if (typeof gitStatus.progress === 'number') {
          return {
            icon: IconName.ArrowUp,
            isDisabled: true,
            variant: ActionButtonVariant.BackgroundAction,
            label: 'Push in progress...',
            affixText: `${Math.ceil(gitStatus.progress * 100)}%`
          };
        } else {
          // Generic text to fit all edge cases
          let label = 'Push local changes';

          if (localCommitCount > 0) {
            // Pluralize the text
            label = localCommitCount === 1 ? `Push 1 local commit` : `Push ${localCommitCount} local commits`;
          } else if (currentBranch?.isLocal) {
            // There are no local commits and the branch is only local.
            label = `Push ${currentBranch.nameWithoutRemote} branch`;
          }

          return {
            icon: IconName.ArrowUp,
            variant: ActionButtonVariant.CallToAction,
            label,
            affixText: lastUpdateText()
          };
        }
      }

      case 'set-authorization': {
        if (git.Provider === 'noodl') {
          return {
            icon: IconName.WarningTriangle,
            variant: ActionButtonVariant.CallToAction,
            label: 'Migration required',
            affixText: 'Noodl git hosting is deprecated'
          };
        }

        return {
          icon: IconName.Setting,
          variant: ActionButtonVariant.CallToAction,
          label: 'Update credentials',
          affixText: 'Invalid credentials'
        };
      }
    }
  })();

  async function onAction() {
    switch (gitStatus.kind) {
      case 'default':
      case 'fetch':
      case 'error-fetch':
        return fetchRemote();

      case 'pull':
        setGitStatus({
          kind: 'pull',
          progress: 0
        });

        try {
          let autoStash: Stash = undefined;
          const autoStashMessge = 'Noodl autostash on pull';

          if (localChangesCount === 0) {
            await git.resetToHead();
          } else {
            try {
              await showStashBeforePullDialog();
            } catch (_) {
              //user canceled
              await fetchLocal();
              return;
            }

            ProjectModel.setSaveOnModelChange(false);
            autoStash = await createStashEntry(repositoryPath, autoStashMessge);
          }

          const remote = await getRemote(repositoryPath);

          ProjectModel.setSaveOnModelChange(false);

          await pull(repositoryPath, remote, currentBranch, (progress) => {
            setGitStatus({
              kind: 'pull',
              progress: progress.value,
              message: progress.title || progress.description
            });
          });

          if (await git.isRebaseInProgress()) {
            await git.tryHandleRebaseState();
            await fetchLocal();
          }

          if (autoStash) {
            try {
              await popStashEntry(repositoryPath, autoStash.name);
            } catch (err) {
              //
              // Here be dragons. Thou art forewarned
              //
              if (err.toString().includes('could not restore untracked files from stash')) {
                const stashBranchName = `!!Noodl-AutoStash-${autoStash.branchName}`;

                // Having some minor changes to project.json
                await git.resetToHead();

                // Create a new branch from the stash
                // this will also checkout the branch
                await popStashEntryToBranch(repositoryPath, autoStash.name, stashBranchName);

                // Merge our working branch into the stash branch
                await git._merge({
                  theirsBranchName: currentBranch.name,
                  oursBranchName: stashBranchName,
                  isSquash: false,
                  message: undefined,
                  allowFastForward: false
                });

                const changes = await git.status();
                if (changes.length > 0) {
                  await git.commit('Merge stash');
                }

                // TODO: Should we make sure there are no issues?

                // Checkout the working branch
                await git.checkoutBranch(currentBranch.nameWithoutRemote);

                // Squash merge our stash branch into the working branch without making any commits.
                await merge(repositoryPath, stashBranchName, {
                  strategy: 'recursive',
                  strategyOption: 'theirs',
                  isSquash: true,
                  squashNoCommit: true,
                  message: undefined,
                  noFastForward: true
                });

                // Delete the stash branch
                await git.deleteBranch(stashBranchName);

                // And what should be left on the working branch is our stash, that we love so much!
              } else {
                // We failed to pop the stash, this shouldn't happen, but we just log the error and return false.
                throw err;
              }
            }
          }

          EventDispatcher.instance.notifyListeners('projectChangedOnDisk');
        } catch (error) {
          if (error instanceof GitActionError) {
            if (error.code === GitActionErrorCode.AuthorizationFailed) {
              setGitStatus({
                kind: 'set-authorization'
              });
            } else {
              ToastLayer.showError(error.message);
            }
          } else {
            console.error(error);
            ToastLayer.showError('Failed to pull. Error: ' + error);
          }
        }

        ProjectModel.setSaveOnModelChange(true);

        await fetchLocal();
        break;

      case 'push':
        setGitStatus({
          kind: 'push',
          progress: 0
        });

        try {
          await push({
            baseDir: repositoryPath,
            currentBranch,
            onProgress: (progress) => {
              setGitStatus({
                kind: 'push',
                message: progress.title,
                progress: progress.value
              });
            }
          });
        } catch (error) {
          if (error instanceof GitActionError && error.code === GitActionErrorCode.AuthorizationFailed) {
            setGitStatus({
              kind: 'set-authorization'
            });
          } else {
            ToastLayer.showError('Failed to push. ' + error);

            // If the error is a rejected push, we need to fetch again to get the latest state where we can pull and rebase
            if (error?.toString().includes('rejected')) {
              await fetchRemote();
            }
          }

          return;
        }

        await fetchRemote();

        break;
      case 'push-repository':
      case 'set-authorization':
        openGitSettingsPopout();
        break;
    }
  }

  return (
    <>
      <StashBeforePullDialog />
      <ActionButton {...props} onClick={onAction} />
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { GitActionError, GitActionErrorCode, getBranches } from '@noodl/git';
import { Branch } from '@noodl/git/src/core/models/branch';
import { Stash } from '@noodl/git/src/core/models/snapshot';
import { WorkingDirectoryStatus } from '@noodl/git/src/core/models/status';
import { getStashes } from '@noodl/git/src/core/stash';
import { getStatus } from '@noodl/git/src/core/status';
import { PromiseUtils } from '@noodl/platform';

import { ToastLayer } from '../../../ToastLayer';
import { GitStatus, IVersionControlContextFetch } from './types';

export function useVersionControlFetch({ git }): IVersionControlContextFetch {
  // UI
  const [gitStatus, setGitStatus] = useState<GitStatus>({ kind: 'default' });
  const [lastFetchTime, setLastFetchTime] = useState<number>(undefined);

  // Data
  const [currentBranch, setCurrentBranch] = useState<Branch>(undefined);
  const [currentCommitSha, setCurrentCommitSha] = useState<string>(undefined);
  const [remoteCommitSha, setRemoteCommitSha] = useState<string>(undefined);
  const [workingDirectoryStatus, setWorkingDirectoryStatus] = useState<WorkingDirectoryStatus>(null);
  const [branches, setBranches] = useState<readonly Branch[]>(undefined);
  const [stashes, setStashes] = useState<readonly Stash[]>([]);

  // Data helpers
  const [localCommitCount, setLocalCommitCount] = useState<number>(undefined);
  const [remoteCommitCount, setRemoteCommitCount] = useState<number>(undefined);

  const fetchLocal = useCallback(async () => {
    const { workingDirectoryStatus, headSha, remoteHeadSha, branchName, branches, stashes } =
      await PromiseUtils.allObjects({
        workingDirectoryStatus: getStatus(git.repositoryPath),
        headSha: git.getHeadCommitId(),
        remoteHeadSha: git.getRemoteHeadCommitId(),
        branchName: git.getCurrentBranchName(),
        branches: getBranches(git.repositoryPath),
        stashes: getStashes(git.repositoryPath)
      });

    if (remoteHeadSha) {
      const aheadBehind = await git.aheadBehind(headSha, remoteHeadSha);

      setLocalCommitCount(aheadBehind.ahead);
      setRemoteCommitCount(aheadBehind.behind);
    } else {
      setLocalCommitCount(0);
      setRemoteCommitCount(0);
    }

    setWorkingDirectoryStatus(workingDirectoryStatus);
    setCurrentCommitSha(headSha);
    setRemoteCommitSha(remoteHeadSha);
    setCurrentBranch(branches.find((x) => x.name === branchName));
    setBranches(branches);
    setStashes(stashes.entries);
  }, []);

  const fetchRemote = useCallback(async () => {
    async function perform() {
      await git.fetch({
        onProgress: (value) => {
          setGitStatus({
            kind: 'fetch',
            progress: value.value
          });
        }
      });

      setLastFetchTime(Date.now());

      await fetchLocal();
    }

    // Fetch remote changes
    setGitStatus({
      kind: 'fetch',
      progress: undefined
    });

    let success = false;
    let lastError = '';

    try {
      await perform();
      success = true;
    } catch (e) {
      if (e instanceof GitActionError) {
        switch (e.code) {
          case GitActionErrorCode.LocalRepository:
            setGitStatus({
              kind: 'push-repository'
            });
            return;
          case GitActionErrorCode.AuthorizationFailed:
            setGitStatus({
              kind: 'set-authorization'
            });
            return;
        }
      }

      lastError = e.message;
      console.log(e.message);
    }

    if (!success) {
      // Check if the user is offline
      if (!window.navigator.onLine) {
        setGitStatus({
          kind: 'error',
          message: 'Please try again, it looks like you are offline.'
        });
      } else {
        setGitStatus({
          kind: 'error-fetch',
          message: lastError ?? 'Please try again'
        });

        if (lastError) {
          ToastLayer.showError(lastError);
        }
      }
      console.log(`Git fetch failed`);
    } else {
      setGitStatus((previous) => {
        if (previous.kind !== 'fetch') {
          return previous;
        }

        return {
          kind: 'default'
        };
      });
    }
  }, [fetchLocal]);

  const createStashMessage = useCallback(() => {
    // NOTE: Using ":" here will create a marker and message.
    return `Stash from ${currentBranch.nameWithoutRemote} branch at #${currentCommitSha.slice(0, 7)}`;
  }, [currentBranch, currentCommitSha]);

  return {
    gitStatus,
    setGitStatus,
    lastFetchTime,
    currentBranch,
    currentCommitSha,
    remoteCommitSha,
    workingDirectoryStatus,
    branches,
    stashes,
    localCommitCount,
    remoteCommitCount,
    fetchLocal,
    fetchRemote,
    createStashMessage
  };
}

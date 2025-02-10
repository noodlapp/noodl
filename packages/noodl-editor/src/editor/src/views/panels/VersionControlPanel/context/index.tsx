import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Git } from '@noodl/git';

import { ArrayDiff } from '@noodl-utils/projectmerger.diff';

import { Slot } from '@noodl-core-ui/types/global';

import { doLocalDiff, ProjectLocalDiff } from './DiffUtils';
import { useVersionControlFetch } from './fetch.context';
import { BranchStatus, IVersionControlContext } from './types';
import { ProjectModel } from '@noodl-models/projectmodel';

const VersionControlContext = createContext<IVersionControlContext>({
  git: null,
  repositoryPath: null,
  activeTabId: null,
  setActiveTabId: null,
  selectedCommit: null,
  setSelectedCommit: null,
  isPerformingAction: null,
  setIsPerformingAction: null,
  branchStatus: null,
  setBranchStatus: null,
  updateLocalDiff: null,
  localDiff: null,
  localFiles: null,
  localChangesCount: null,
  fetch: null
});

function getNumChanges(changes: ArrayDiff<any>) {
  if (!changes) return 0;
  return changes.changed.length + changes.created.length + changes.deleted.length;
}

export function VersionControlProvider({ git, children }: { git: Git; children: Slot }) {
  // UI
  const [branchStatus, setBranchStatus] = useState<BranchStatus>(null);
  const [activeTabId, setActiveTabId] = useState('changes');
  const [selectedCommit, setSelectedCommit] = useState<string>(undefined);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [localDiff, setLocalDiff] = useState<ProjectLocalDiff>(null);

  const fetch = useVersionControlFetch({ git });

  const localFiles = (fetch.workingDirectoryStatus?.files || []).filter((f) => f.path !== 'project.json');

  const localChangesCount =
    getNumChanges(localDiff?.components) +
    localFiles.length +
    getNumChanges(localDiff?.settings) +
    getNumChanges(localDiff?.styles.colors) +
    getNumChanges(localDiff?.styles.text) +
    getNumChanges(localDiff?.cloudservices);

  const updateLocalDiff = useCallback(() => {
    setLocalDiff(null); //reset old diff to show loaders again
    (async () => {
      const currentCommitSha = await git.getHeadCommitId();
      if (currentCommitSha) {
        const projectPath = ProjectModel.instance._retainedProjectDirectory;
        const diff = await doLocalDiff(git.repositoryPath, projectPath, currentCommitSha);
        setLocalDiff(diff);
      }
    })();
  }, []);

  //refresh diff if the current commit is changed, but only if we already have a diff
  useEffect(() => {
    if (localDiff?.commitShaDiffedTo && localDiff?.commitShaDiffedTo !== fetch.currentCommitSha) {
      updateLocalDiff();
    }
  }, [localDiff?.commitShaDiffedTo, fetch.currentCommitSha]);

  useEffect(() => {
    // User have to push before we can do anything
    if (fetch.gitStatus.kind === 'push-repository') {
      return;
    }

    if (fetch.remoteCommitCount > 0) {
      fetch.setGitStatus({
        kind: 'pull'
      });
    } else if (fetch.currentBranch?.isLocal || fetch.localCommitCount > 0) {
      fetch.setGitStatus({
        kind: 'push'
      });
    } else {
      fetch.setGitStatus({
        kind: 'default'
      });
    }
  }, [fetch.remoteCommitCount, fetch.localCommitCount, fetch.currentBranch]);

  // Do the first status check
  useEffect(() => {
    // Fetch the current info first then we do a fetch call
    fetch.fetchRemote();
  }, []);

  const repositoryPath = git.repositoryPath;

  return (
    <VersionControlContext.Provider
      value={{
        git,
        repositoryPath,

        activeTabId,
        setActiveTabId,

        selectedCommit,
        setSelectedCommit,

        isPerformingAction,
        setIsPerformingAction,

        branchStatus,
        setBranchStatus,

        localDiff: localDiff,
        localFiles,
        localChangesCount,
        updateLocalDiff,

        fetch
      }}
    >
      {children}
    </VersionControlContext.Provider>
  );
}

export function useVersionControlContext() {
  const context = useContext(VersionControlContext);

  if (context === undefined) {
    throw new Error('useVersionControlContext must be a child of VersionControlProvider');
  }

  return context;
}

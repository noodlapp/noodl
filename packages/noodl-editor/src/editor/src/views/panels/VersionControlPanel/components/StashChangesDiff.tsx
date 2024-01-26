import {ProjectDiff, diffProject} from '@noodl-utils/projectmerger.diff';
import React, { useEffect, useState } from 'react';
import { FileChange } from '@noodl/git/src/core/models/status';
import { applyPatches } from '@noodl-models/ProjectPatches/applypatches';
import { Commit, SnapshotEntry, Stash } from '@noodl/git/src/core/models/snapshot';
import { useVersionControlContext } from '../context';
import { getCommit } from '@noodl/git/src/core/logs';
import { DiffList } from './DiffList';

export interface StashChangesDiffProps {
  stash: Stash;
}

export function StashChangesDiff({ stash }: StashChangesDiffProps) {
  const [diff, setDiff] = useState<ProjectDiff>(null);
  const [commitFiles, setCommitFiles] = useState<readonly FileChange[]>(null);

  const { repositoryPath, fetch } = useVersionControlContext();

  useEffect(() => {
    //This component might re-render with a new diff, so reset diff to show loading indicator again
    setDiff(null);
    setCommitFiles(null);

    if (!fetch.currentCommitSha) {
      return;
    }

    async function doDiff() {
      async function getProjectFile(snapshot: SnapshotEntry) {
        const projectContent = JSON.parse(await snapshot.getFileAsString('project.json'));
        applyPatches(projectContent);
        return projectContent;
      }

      const commit = await getCommit(repositoryPath, fetch.currentCommitSha);

      const files = await stash.getFiles();
      setCommitFiles(files);

      const [thisProject, otherProject] = await Promise.all([getProjectFile(commit), getProjectFile(stash)]);
      const diff = diffProject(otherProject, thisProject);
      setDiff(diff);
    }

    doDiff();
  }, [stash]);

  return (
    <DiffList
      diff={diff}
      fileChanges={commitFiles}
      componentDiffTitle={`Changes made in stash #${stash.sha.slice(0, 7)} by ${stash.author.name}`}
    />
  );
}

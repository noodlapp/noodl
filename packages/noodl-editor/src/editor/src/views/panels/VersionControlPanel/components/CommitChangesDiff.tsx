import React, { useEffect, useState } from 'react';
import { getCommitFiles } from '@noodl/git/src/core/diff-tree';
import { getCommit } from '@noodl/git/src/core/logs';
import { getMergeBase } from '@noodl/git/src/core/merge';
import { Commit } from '@noodl/git/src/core/models/snapshot';
import { FileChange } from '@noodl/git/src/core/models/status';
import { revRange } from '@noodl/git/src/core/rev-list';

import { ProjectModel } from '@noodl-models/projectmodel';
import { applyPatches } from '@noodl-models/ProjectPatches/applypatches';
import { mergeProject } from '@noodl-utils/projectmerger';
import { ProjectDiff, diffProject } from '@noodl-utils/projectmerger.diff';

import { useVersionControlContext } from '../context';
import { getProjectFilePath } from '../context/DiffUtils';
import { DiffList } from './DiffList';

//Kind:
// - parent: diff files and project.json to first parent commit
// - merge: files from merge base to refToDiffTo, project is result of a merge and current

type CommitChangesDiffProps =
  | {
      commit: Commit;
      kind: 'parent';
    }
  | {
      commit: Commit;
      refToDiffTo: string;
      kind: 'merge';
    };

export function CommitChangesDiff(props: CommitChangesDiffProps) {
  const [diff, setDiff] = useState<ProjectDiff>(null);
  const [commitFiles, setCommitFiles] = useState<readonly FileChange[]>(null);

  const { commit } = props;
  const { repositoryPath } = useVersionControlContext();

  useEffect(() => {
    //This component might re-render with a new diff, so reset diff to show loading indicator again
    setDiff(null);
    setCommitFiles(null);

    if (!commit || (props.kind === 'merge' && !props.refToDiffTo)) {
      return;
    }

    async function doDiff() {
      if (props.kind === 'parent') {
        const { diff, files } = await getParentDiff(repositoryPath, props.commit);
        setDiff(diff);
        setCommitFiles(files);
      } else if (props.kind === 'merge') {
        const { diff, files } = await getMergeDiff(repositoryPath, props.commit, props.refToDiffTo);
        setDiff(diff);
        setCommitFiles(files);
      }
    }

    doDiff();
  }, [commit, props.kind]);

  if (!commit) {
    return null;
  }

  return (
    <DiffList
      diff={diff}
      fileChanges={commitFiles}
      commit={commit}
      componentDiffTitle={`Changes made in #${commit.shortSha} by ${commit.author.name}`}
    />
  );
}

async function getParentDiff(repositoryPath: string, commit: Commit) {
  const parentSHA = commit.parentSHAs[0];
  if (!parentSHA) {
    //this only happens for the first commit
    const thisProject = await getProjectFile(commit);
    return {
      diff: diffProject({ components: [] }, thisProject),
      files: await commit.getFiles()
    };
  }

  const [currentCommit, otherCommit] = await Promise.all([
    getCommit(repositoryPath, commit.sha),
    getCommit(repositoryPath, parentSHA)
  ]);

  const [currentProject, otherProject] = await Promise.all([
    getProjectFile(currentCommit),
    getProjectFile(otherCommit)
  ]);

  return {
    diff: diffProject(otherProject, currentProject),
    files: await getCommitFiles(repositoryPath, commit.sha)
  };
}

async function getMergeDiff(repositoryPath: string, commit: Commit, refToDiffTo: string) {
  const mergeBaseSHA = await getMergeBase(repositoryPath, commit.sha, refToDiffTo);

  const [currentCommit, otherCommit, mergeBaseCommit] = await Promise.all([
    getCommit(repositoryPath, commit.sha),
    getCommit(repositoryPath, refToDiffTo),
    getCommit(repositoryPath, mergeBaseSHA)
  ]);

  const [currentProject, otherProject, ancestorProject] = await Promise.all([
    getProjectFile(currentCommit),
    getProjectFile(otherCommit),
    getProjectFile(mergeBaseCommit)
  ]);

  const result = mergeProject(ancestorProject, JSON.parse(JSON.stringify(currentProject)), otherProject);

  return {
    diff: diffProject(currentProject, result),
    files: await getCommitFiles(repositoryPath, revRange(commit.sha, refToDiffTo))
  };
}

async function getProjectFile(commit: Commit) {
  const projectFilePath = getProjectFilePath(commit.repositoryDir, ProjectModel.instance._retainedProjectDirectory);

  const projectContentRaw = await commit.getFileAsString(projectFilePath);
  const projectContent = JSON.parse(projectContentRaw);
  applyPatches(projectContent);
  return projectContent;
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CommitHistory, CommitHistoryEntry } from '@noodl/git';
import { Commit } from '@noodl/git/src/core/models/snapshot';

import { ScrollArea } from '@noodl-core-ui/components/layout/ScrollArea';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { BranchColor, HistoryItemBranch } from '@noodl-core-ui/components/version-control/GitHistoryItem';

import { useVersionControlContext } from '../context';
import { Collaborator, useCollaborators } from '../hooks/usecollaborators';
import { HistoryCommitDiff } from './HistoryCommitDiff';
import { CommitListItem } from './HistoryCommitItem';

export type HistoryItemModel = {
  commit: CommitHistoryEntry;
  /** TODO: Many Collaborators */
  collaborator: Collaborator | undefined;
  branches: HistoryItemBranch[];
};

export function History() {
  const { repositoryPath, git, localChangesCount, selectedCommit, setSelectedCommit, fetch } =
    useVersionControlContext();
  const { currentBranch, currentCommitSha } = fetch;

  const collaborators = useCollaborators();

  const history = useMemo(() => new CommitHistory(repositoryPath, currentBranch), [repositoryPath, currentBranch]);
  const [commits, setCommits] = useState<readonly CommitHistoryEntry[]>([]);
  const [selectedCommitData, setSelectedCommitData] = useState<Commit>(null);

  useEffect(() => {
    (async () => {
      if (selectedCommit) {
        const commit = await git.getCommitFromId(selectedCommit);
        setSelectedCommitData(commit);
      } else {
        setSelectedCommitData(null);
      }
    })();
  }, [selectedCommit]);

  const items = useMemo(
    () => createBranchAndItemList(currentCommitSha, commits, collaborators, !!localChangesCount),
    [currentCommitSha, collaborators, commits, localChangesCount]
  );

  const isLoading = useRef(false);
  const fetchData = async () => {
    if (!currentBranch) {
      return;
    }

    if (isLoading.current) return;
    isLoading.current = true;

    // TODO: Handle error
    const newCommits = await history.fetch(100);
    setCommits(newCommits);

    isLoading.current = false;
  };

  useEffect(() => {
    fetchData();
  }, [history]);

  const remoteAheadCommits = items.filter((c) => c.commit.isRemoteAhead);
  const otherCommits = items.filter((c) => !c.commit.isRemoteAhead);

  return (
    <VStack UNSAFE_style={{ height: '100%' }}>
      <ScrollArea>
        <VStack UNSAFE_style={{ flex: '1', minHeight: '81px' }}>
          {Boolean(remoteAheadCommits.length) && (
            <Section title="Remote Commits">
              {remoteAheadCommits.map((x) => (
                <CommitListItem
                  item={x}
                  key={x.commit.sha}
                  onCommitSelected={setSelectedCommit}
                  selectedCommit={selectedCommit}
                />
              ))}
            </Section>
          )}
          {Boolean(otherCommits.length) && (
            <Section title="Commits">
              {otherCommits.map((x) => (
                <CommitListItem
                  item={x}
                  key={x.commit.sha}
                  onCommitSelected={setSelectedCommit}
                  selectedCommit={selectedCommit}
                />
              ))}
            </Section>
          )}
        </VStack>
      </ScrollArea>

      {Boolean(selectedCommitData) && <HistoryCommitDiff commit={selectedCommitData} />}
    </VStack>
  );
}

function createBranchAndItemList(
  headCommitId: string,
  commits: readonly CommitHistoryEntry[],
  collaborators: Collaborator[],
  hasLocalChanges: boolean
): HistoryItemModel[] {
  if (commits.length === 0) return [];

  //Two "branches":;
  const remoteCommits = commits.filter((c) => !c.isLocalAhead); //stuff that's on the remote
  const localCommits = commits.filter((c) => c.isLocalAhead); //local commits that haven't been pushed

  //if we have local uncommited changes, visualize it as a special list item on the local branch
  if (hasLocalChanges) {
    localCommits.unshift(
      new CommitHistoryEntry(
        new Commit(null, 'local changes', undefined, 'Local changes', undefined, undefined, undefined, [], []),
        false,
        false
      )
    );
  }

  function mapItem(commit: CommitHistoryEntry, branches: HistoryItemModel['branches']): HistoryItemModel {
    const collaborator = collaborators?.find((c) => c.email === commit.author?.email);
    return {
      commit,
      collaborator,
      branches
    };
  }

  let itemData: HistoryItemModel[] = [];
  if (localCommits.length && remoteCommits.length) {
    const spacing = 28;
    //we have two branches

    //the local changes are "branched" from the first remote commit that is not ahead
    let localStartIndex = remoteCommits.findIndex((c) => !c.isRemoteAhead);

    if (localStartIndex === -1) {
      // there is no local commit, so local changes are "branched" from the latest pulled remote commit
      localStartIndex = 0;
    }

    //add all remote commits that are ahead
    for (let i = 0; i < localStartIndex; i++) {
      const c = remoteCommits[i];
      itemData.push(
        mapItem(c, [
          {
            x: 0,
            top: i > 0,
            bottom: c.parentSHAs.length > 0,
            color: BranchColor.Remote_Ahead,
            circle: true,
            isHead: false
          }
        ])
      );
    }

    //time for local commits
    const hasRemoteBranch = localStartIndex > 0;
    for (let i = 0; i < localCommits.length; i++) {
      const c = localCommits[i];

      const branches: HistoryItemBranch[] = [];
      if (hasRemoteBranch) {
        branches.push({
          x: 0,
          top: true,
          bottom: true,
          color: BranchColor.Remote_Ahead,
          circle: false,
          isHead: false
        });
      }
      branches.push({
        x: spacing,
        top: i > 0,
        bottom: i < localCommits.length,
        color: BranchColor.Local,
        circle: true,
        isHead: i === 0
      });
      itemData.push(mapItem(c, branches));
    }

    //commits after local changes
    for (let i = localStartIndex; i < remoteCommits.length; i++) {
      const c = remoteCommits[i];
      const branches: HistoryItemBranch[] = [
        {
          x: 0,
          top: i > localStartIndex || localStartIndex > 0,
          topColor: i === localStartIndex ? BranchColor.Remote_Ahead : BranchColor.Remote,
          bottom: c.parentSHAs.length > 0,
          color: c.isRemoteAhead ? BranchColor.Remote_Ahead : BranchColor.Remote,
          circle: true,
          isHead: false
        }
      ];
      if (i === localStartIndex) {
        branches[0].branchPoints = [{ x: spacing, color: 'var(--branch-color-local)' }];
      }
      itemData.push(mapItem(c, branches));
    }
  } else if (localCommits.length) {
    itemData = localCommits.map((c, i) => {
      return mapItem(c, [
        {
          x: 0,
          top: i > 0,
          bottom: c.parentSHAs.length > 0 || c.sha === 'local changes',
          color: BranchColor.Local,
          circle: true,
          isHead: c.sha === headCommitId && !hasLocalChanges
        }
      ]);
    });
  } else if (remoteCommits.length) {
    itemData = remoteCommits.map((c, i) => {
      return mapItem(c, [
        {
          x: 0,
          top: i > 0,
          bottom: c.parentSHAs.length > 0,
          color: c.isRemoteAhead ? BranchColor.Remote_Ahead : BranchColor.Remote,
          circle: true,
          isHead: c.sha === headCommitId
        }
      ]);
    });
  }

  return itemData;
}

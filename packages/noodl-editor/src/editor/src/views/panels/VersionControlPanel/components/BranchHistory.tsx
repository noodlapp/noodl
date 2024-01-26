import React, { useState } from 'react';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { HistoryCommitDiff } from './HistoryCommitDiff';
import { Commit } from '@noodl/git/src/core/models/snapshot';
import { GitCommit } from '@noodl/git';

export interface BranchHistoryProps {}

export function BranchHistory({}: BranchHistoryProps) {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [selectedCommitData, setSelectedCommitData] = useState<Commit>(null);

  return (
    <Container direction={ContainerDirection.Vertical} UNSAFE_style={{ height: '100%' }}>
      <Section UNSAFE_style={{ flex: '1' }}>
        <Section title="Commits to merge">
          {/*commits.map((x) => (
              <CommitListItem
                item={x}
                key={x.sha}
                onCommitSelected={setSelectedCommit}
                selectedCommit={selectedCommit}
              />
            ))*/}
        </Section>
      </Section>

      {Boolean(selectedCommitData) && <HistoryCommitDiff commit={selectedCommitData} />}
    </Container>
  );
}

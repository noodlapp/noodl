import React from 'react';
import { GitHistoryItem } from '@noodl-core-ui/components/version-control/GitHistoryItem';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Text, TextSize, TextType } from '@noodl-core-ui/components/typography/Text';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { UserBadge, UserBadgeSize } from '@noodl-core-ui/components/user/UserBadge';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { HistoryItemModel } from './History';

export interface CommitListItemProps {
  item: HistoryItemModel;
  onCommitSelected: (sha: string) => void;
  selectedCommit: string;
}

export function CommitListItem({ item, onCommitSelected, selectedCommit }: CommitListItemProps) {
  function onClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // item.shortSha is the easiest way to check if this is a remote commit atm
    if (!!item.commit.shortSha) {
      if (selectedCommit && item.commit.sha === selectedCommit) {
        onCommitSelected(null);
      } else {
        onCommitSelected(item.commit.sha);
        setTimeout(() => {
          (e.target as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    }
  }

  const collaborator = item.collaborator || (item.commit.author ? { id: 'invalid-id', ...item.commit.author } : null);
  const date = item.commit.author?.date?.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      <GitHistoryItem
        branches={item.branches}
        isSelected={item.commit.sha === selectedCommit}
        hasAction={!!item.commit.shortSha}
        onClick={onClick}
      >
        {Boolean(item.commit.summary) && (
          <Box hasBottomSpacing={2} hasTopSpacing={!collaborator} hasRightSpacing={4}>
            <Text size={TextSize.Default}>{item.commit.summary}</Text>
          </Box>
        )}

        {Boolean(collaborator) && (
          <Box UNSAFE_style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
            <Tooltip content={collaborator.name || collaborator.email}>
              <UserBadge
                email={collaborator.email}
                id={collaborator.id}
                name={collaborator.name}
                size={UserBadgeSize.Small}
              />
            </Tooltip>
            <VStack>
              {Boolean(item.commit.shortSha) && (
                <Box hasLeftSpacing={2}>
                  <Text size={TextSize.Medium} textType={TextType.Proud}>
                    #{item.commit.shortSha}
                  </Text>
                </Box>
              )}
              <Box hasLeftSpacing={2}>
                <Text size={TextSize.Medium}>{date}</Text>
              </Box>
            </VStack>
          </Box>
        )}
        {Boolean(item.commit.tags.length) && (
          <Box hasTopSpacing={2} UNSAFE_style={{ display: 'flex' }}>
            {item.commit.tags.map((tag) => (
              <div
                style={{
                  borderRadius: 4,
                  backgroundColor: 'var(--theme-color-secondary)',
                  color: 'var(--theme-color-on-secondary)',
                  padding: '4px 8px'
                }}
              >
                {tag}
              </div>
            ))}
          </Box>
        )}
      </GitHistoryItem>
    </>
  );
}

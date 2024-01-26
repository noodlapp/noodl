import React, { useEffect, useRef, useState } from 'react';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import { Text } from '@noodl-core-ui/components/typography/Text';
import classNames from 'classnames';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';

import css from './GitStashCard.module.scss';
import { IconButton, IconButtonVariant, IconButtonState } from '@noodl-core-ui/components/inputs/IconButton';
import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { useVersionControlContext } from '../../context';
import { Commit, Stash } from '@noodl/git/src/core/models/snapshot';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { addLeadingZero, getMonthNameFromNumber, isSameDay } from '@noodl-utils/dateUtils';
import { VStack, HStack } from '@noodl-core-ui/components/layout/Stack';
import { StashChangesDiff } from '../StashChangesDiff';

export interface GitStashCardProps {
  stash: Stash;

  onDeleteClick: () => void;
  onApplyClick: () => void;
}

export default function GitStashCard({ stash, onDeleteClick, onApplyClick }: GitStashCardProps) {
  const { git } = useVersionControlContext();

  const rootRef = useRef<HTMLDivElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [commit, setCommit] = useState<Commit>(null);

  let isDrawerCollapsed = !isDrawerOpen;

  useEffect(() => {
    if (!rootRef?.current) return;
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [rootRef?.current]);

  useEffect(() => {
    const getCommit = async () => {
      setCommit(await git.getCommitFromId(stash.sha));
    };

    if (!isDrawerCollapsed && !commit) {
      getCommit();
    }
  }, [stash.sha, isDrawerCollapsed, commit]);

  const date = stash.author.date;
  const dateString = isSameDay(date, new Date())
    ? `today at ${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}`
    : `${date.getDate()} ${getMonthNameFromNumber(date.getMonth())} ${date.getFullYear()}`;

  return (
    <div ref={rootRef} className={classNames([css['Root'], !isDrawerCollapsed && css['is-open']])}>
      <div className={classNames(css['Inner'])} onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
        <VStack UNSAFE_style={{ flexGrow: 1 }}>
          <HStack UNSAFE_style={{ justifyContent: 'space-between' }}>
            <HStack>
              <Icon size={IconSize.Tiny} icon={IconName.StructureCircle} />
              <Text>{stash.branchName}</Text>
            </HStack>
            <Text>{dateString}</Text>
          </HStack>
        </VStack>

        <div className={css['ToggleContainer']}>
          <IconButton
            icon={IconName.CaretDown}
            variant={IconButtonVariant.Transparent}
            state={isDrawerOpen ? IconButtonState.Rotated : null}
          />
        </div>
      </div>

      <Collapsible isCollapsed={isDrawerCollapsed}>
        <div className={classNames(css['Drawer'])}>
          {Boolean(commit) && <StashChangesDiff stash={stash} />}

          <Section hasGutter hasVisibleOverflow>
            <Text hasBottomSpacing>{stash.message}</Text>
            <PrimaryButton
              size={PrimaryButtonSize.Small}
              label="Apply stash"
              hasBottomSpacing
              isGrowing
              onClick={onApplyClick}
            />

            <PrimaryButton
              variant={PrimaryButtonVariant.MutedOnLowBg}
              label="Delete stash"
              size={PrimaryButtonSize.Small}
              isGrowing
              onClick={onDeleteClick}
            />
          </Section>
        </div>
      </Collapsible>
    </div>
  );
}

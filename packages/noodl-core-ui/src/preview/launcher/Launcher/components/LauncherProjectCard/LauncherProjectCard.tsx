import React from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { Card, CardBackground } from '@noodl-core-ui/components/common/Card';
import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton } from '@noodl-core-ui/components/inputs/IconButton';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextButton, TextButtonSize } from '@noodl-core-ui/components/inputs/TextButton';
import { DialogRenderDirection } from '@noodl-core-ui/components/layout/BaseDialog';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Columns } from '@noodl-core-ui/components/layout/Columns';
import { HStack, Stack, VStack } from '@noodl-core-ui/components/layout/Stack';
import { ContextMenu, ContextMenuProps } from '@noodl-core-ui/components/popups/ContextMenu';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label, LabelSize, LabelSpacingSize } from '@noodl-core-ui/components/typography/Label';
import { Text, TextSize, TextType } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize } from '@noodl-core-ui/components/typography/Title';
import { UserBadgeProps, UserBadgeSize } from '@noodl-core-ui/components/user/UserBadge';
import { UserBadgeList } from '@noodl-core-ui/components/user/UserBadgeList';

import css from './LauncherProjectCard.module.scss';

// FIXME: Use the timeSince function from the editor package when this is moved there
function timeSince(date: Date | number) {
  const date_unix = typeof date === 'number' ? date : date.getTime();
  var seconds = Math.floor((new Date().getTime() - date_unix) / 1000);

  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + ' years';
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + ' months';
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + ' days';
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + ' hours';
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + ' minutes';
  }
  return Math.floor(seconds) + ' seconds';
}

export enum CloudSyncType {
  None = 'Local',
  Git = 'Git'
}

export interface LauncherProjectData {
  id: string;
  title: string;
  cloudSyncMeta: {
    type: CloudSyncType;
    source?: string;
  };
  localPath: string;
  lastOpened: string;
  pullAmount?: number;
  pushAmount?: number;
  uncommittedChangesAmount?: number;
  imageSrc: string;
  contributors?: UserBadgeProps[];
}

export interface LauncherProjectCardProps extends LauncherProjectData {
  contextMenuItems: ContextMenuProps[];
}

export function LauncherProjectCard({
  id,
  title,
  cloudSyncMeta,
  lastOpened,
  pullAmount,
  pushAmount,
  uncommittedChangesAmount,
  imageSrc,
  contextMenuItems,
  contributors
}: LauncherProjectCardProps) {
  return (
    <Card
      background={CardBackground.Bg2}
      hoverBackground={CardBackground.Bg3}
      onClick={() => alert('FIXME: open project')}
    >
      <Stack direction="row">
        <div className={css.Image} style={{ backgroundImage: `url(${imageSrc})` }} />

        <div className={css.Details}>
          <Columns layoutString="1 1 1" hasXGap={4}>
            <div>
              <Title hasBottomSpacing size={TitleSize.Medium}>
                {title}
              </Title>
              <Label variant={TextType.Shy}>Last opened {timeSince(new Date(lastOpened))} ago</Label>
            </div>

            <div>
              {cloudSyncMeta.type === CloudSyncType.None && (
                <div>
                  <Label hasBottomSpacing>None</Label>
                  <HStack UNSAFE_style={{ alignItems: 'center' }} hasSpacing={1}>
                    <Icon icon={IconName.WarningCircle} variant={TextType.Shy} size={IconSize.Tiny} />
                    <Label variant={TextType.Shy}>Project is only local</Label>
                  </HStack>
                </div>
              )}

              {cloudSyncMeta.type === CloudSyncType.Git && (
                <div className={css.TypeDisplay}>
                  <TextButton
                    label="Open Git repo"
                    size={TextButtonSize.Small}
                    icon={IconName.ExternalLink}
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('FIXME: Link to repo?');
                    }}
                  />
                </div>
              )}

              <HStack hasSpacing={4} UNSAFE_style={{ paddingLeft: 4 }}>
                {Boolean(pullAmount) && (
                  <Tooltip
                    content={`${pullAmount} unpulled commits`}
                    showAfterMs={200}
                    UNSAFE_className={css.VersionControlTooltip}
                  >
                    <HStack UNSAFE_style={{ alignItems: 'center' }}>
                      <Icon icon={IconName.CloudDownload} variant={FeedbackType.Notice} size={IconSize.Tiny} />
                      <Label hasLeftSpacing={LabelSpacingSize.Small} variant={FeedbackType.Notice}>
                        {pullAmount}
                      </Label>
                    </HStack>
                  </Tooltip>
                )}

                {Boolean(pushAmount) && (
                  <Tooltip
                    content={`${pushAmount} unpushed local commits`}
                    showAfterMs={200}
                    UNSAFE_className={css.VersionControlTooltip}
                  >
                    <HStack UNSAFE_style={{ alignItems: 'center' }}>
                      <Icon icon={IconName.CloudUpload} variant={FeedbackType.Danger} size={IconSize.Tiny} />
                      <Label hasLeftSpacing={LabelSpacingSize.Small} variant={FeedbackType.Danger}>
                        {pushAmount}
                      </Label>
                    </HStack>
                  </Tooltip>
                )}

                {Boolean(uncommittedChangesAmount) && (
                  <Tooltip
                    content={`${uncommittedChangesAmount} uncommitted changes`}
                    showAfterMs={200}
                    UNSAFE_className={css.VersionControlTooltip}
                  >
                    <HStack UNSAFE_style={{ alignItems: 'center' }}>
                      <Icon
                        icon={IconName.WarningCircle}
                        variant={FeedbackType.Danger}
                        size={IconSize.Tiny}
                        UNSAFE_className={css.VersionControlTooltip}
                      />
                      <Label hasLeftSpacing={LabelSpacingSize.Small} variant={FeedbackType.Danger}>
                        {uncommittedChangesAmount}
                      </Label>
                    </HStack>
                  </Tooltip>
                )}
              </HStack>
            </div>

            <HStack UNSAFE_style={{ justifyContent: 'space-between', alignItems: 'center' }} hasSpacing={4}>
              <HStack UNSAFE_style={{ alignItems: 'center' }} hasSpacing={2}>
                {/* FIXME: get default user data from user object */}
                <UserBadgeList
                  badges={contributors || [{ name: 'Tore Knudsen', email: 'tore@noodl.net', id: 'Tore' }]}
                  size={UserBadgeSize.Medium}
                  maxVisible={4}
                />

                {!Boolean(contributors) && <Label variant={TextType.Shy}>(Only you)</Label>}
              </HStack>

              {Boolean(contextMenuItems) && (
                <div>
                  <ContextMenu renderDirection={DialogRenderDirection.Below} menuItems={contextMenuItems} />
                </div>
              )}
            </HStack>
          </Columns>
        </div>
      </Stack>
    </Card>
  );
}

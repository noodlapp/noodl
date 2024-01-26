import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Slot } from '@noodl-core-ui/types/global';
import { getBadgeAndNameForUser } from '@noodl-core-ui/utils/collaborator';
import classNames from 'classnames';
import React from 'react';
import { ActivityIndicator } from '../../common/ActivityIndicator';
import { Text, TextProps, TextSize, TextType } from '../../typography/Text';
import { Title, TitleSize, TitleVariant } from '../../typography/Title';
import { UserBadge } from '../UserBadge';
import css from './UserListingCard.module.scss';

export enum UserListingCardVariant {
  Default = 'default',
  Launcher = 'launcher',
  InModal = 'in-modal'
}

export interface UserListingCardProps {
  variant?: UserListingCardVariant;

  role?: 'you' | 'owner' | 'collaborator';
  name: string;
  email: string;
  id: string;
  metaText?: TextProps['children'];
  metaType?: TextProps['textType'];
  interactionSlot?: Slot;
  isLoading?: boolean;
}

export function UserListingCard({
  variant = UserListingCardVariant.Default,
  role,
  name,
  email,
  id,
  metaText,
  metaType = TextType.Shy,
  interactionSlot,
  isLoading
}: UserListingCardProps) {
  return (
    <article
      className={classNames([
        css['Root'],
        css[`is-variant-${variant}`],
        role === 'you' && css['is-interaction-slot-always-visible']
      ])}
    >
      <div className={css['Information']}>
        <div className={css['Avatar']}>
          <UserBadge name={name} email={email} id={id} />
        </div>

        <div className={css['Details']}>
          {metaText && (
            <Label size={LabelSize.Small} variant={metaType}>
              {metaText}
            </Label>
          )}
          <Title variant={TitleVariant.DefaultContrast} size={TitleSize.Medium}>
            {name}
          </Title>
          <Text>{email}</Text>
        </div>
      </div>

      <div className={css['Controls']}>{interactionSlot}</div>

      {isLoading && <ActivityIndicator isOverlay />}
    </article>
  );
}

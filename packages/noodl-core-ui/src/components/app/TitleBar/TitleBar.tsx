import classNames from 'classnames';
import React from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { TextButton, TextButtonSize } from '@noodl-core-ui/components/inputs/TextButton';

import css from './TitleBar.module.scss';

export enum TitleBarVariant {
  Default = 'default',
  Shallow = 'shallow'
}

export enum TitleBarState {
  Default = 'default',
  UpdateAvailable = 'version-available',
  Updated = 'version-updated'
}

export interface TitleBarProps {
  title: string;
  version?: string;

  state?: TitleBarState;
  variant?: TitleBarVariant;

  onNewVersionAvailableClicked?: () => void;
  onNewUpdateAvailableClicked?: () => void;

  isWindows?: boolean;
  onMinimizeClicked?: () => void;
  onMaximizeClicked?: () => void;
  onCloseClicked?: () => void;
}

export function TitleBar({
  title,
  version,
  state = TitleBarState.Default,
  variant = TitleBarVariant.Default,
  onNewVersionAvailableClicked,
  onNewUpdateAvailableClicked,
  isWindows,
  onMinimizeClicked,
  onMaximizeClicked,
  onCloseClicked
}: TitleBarProps) {
  return (
    <div className={classNames([css['Root'], css[`is-variant-${variant}`]])}>
      <div className={classNames([css['Title']])}>{title}</div>

      {Boolean(variant === TitleBarVariant.Default) && (
        <>
          {state === TitleBarState.UpdateAvailable && (
            <TextButton
              label={`New version available`}
              onClick={onNewVersionAvailableClicked}
              size={TextButtonSize.Small}
              variant={FeedbackType.Notice}
              //@ts-ignore
              UNSAFE_style={{ WebkitAppRegion: 'no-drag' }} //make it clickable
              hasLeftSpacing
              hasRightSpacing
            />
          )}

          {state === TitleBarState.Updated && (
            <TextButton
              label="New update downloaded"
              onClick={onNewUpdateAvailableClicked}
              size={TextButtonSize.Small}
              variant={FeedbackType.Notice}
              //@ts-ignore
              UNSAFE_style={{ WebkitAppRegion: 'no-drag' }} //make it clickable
              hasLeftSpacing
              hasRightSpacing
            />
          )}

          {Boolean(version) && <div className={classNames(css['Version'])}>{version}</div>}
        </>
      )}

      {Boolean(isWindows) && (
        <div className={classNames(css['OSWindows'])}>
          {Boolean(variant === TitleBarVariant.Default) && (
            <>
              <div
                className={classNames([css['OSWindowsIcon'], css['OSWindowsIcon__Minimize']])}
                onClick={onMinimizeClicked}
              ></div>
              <div
                className={classNames([css['OSWindowsIcon'], css['OSWindowsIcon__Maximize']])}
                onClick={onMaximizeClicked}
              ></div>
            </>
          )}
          <div
            className={classNames([css['OSWindowsIcon'], css['OSWindowsIcon__Close']])}
            onClick={onCloseClicked}
          ></div>
        </div>
      )}
    </div>
  );
}

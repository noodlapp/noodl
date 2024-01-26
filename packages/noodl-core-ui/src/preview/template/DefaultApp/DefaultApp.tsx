import classNames from 'classnames';
import React from 'react';

import { SideNavigation } from '@noodl-core-ui/components/app/SideNavigation';
import { TitleBar } from '@noodl-core-ui/components/app/TitleBar';
import { FrameDivider } from '@noodl-core-ui/components/layout/FrameDivider';
import { Slot } from '@noodl-core-ui/types/global';

import css from './DefaultApp.module.scss';

/**
 * Returns whether we are running inside the storybook editor canvas.
 *
 * @returns
 */
export function insideFrame() {
  // // The page is in an iframe
  return window.location !== window.parent.location;
}

export interface DefaultAppProps {
  title?: string;

  panel?: JSX.Element;
  document?: Slot;
}

export function DefaultApp({ title = 'Noodl Storybook', panel, document }: DefaultAppProps) {
  const [frameSize, setFrameSize] = React.useState(320);

  const size = insideFrame()
    ? {
        width: 1280,
        height: 1000
      }
    : {
        width: 1440,
        height: 1024
      };

  return (
    <div
      className={classNames([css['Root']])}
      style={{
        ...size,
        position: 'relative'
      }}
    >
      <TitleBar title={title} version="2.7.0" isWindows />
      <div className={classNames([css['Main']])}>
        <FrameDivider
          size={frameSize}
          onSizeChanged={setFrameSize}
          sizeMin={300}
          sizeMax={800}
          first={<SideNavigation toolbar={<></>} panel={panel} />}
          second={document}
          horizontal
        />
      </div>
    </div>
  );
}

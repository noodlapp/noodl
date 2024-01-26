import React from 'react';
import css from './ExternalLink.module.scss';
import { platform } from '@noodl/platform';
import useParsedHref from '@noodl-hooks/useParsedHref';
import classNames from 'classnames';
import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';
import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';

export interface ExternalLinkProps extends UnsafeStyleProps {
  children: Slot;
  href: string;
  testId?: string;
}

export function ExternalLink({
  children,
  href,
  testId,
  UNSAFE_className,
  UNSAFE_style
}: ExternalLinkProps) {
  const parsedHref = useParsedHref(href);
  function handleClick() {
    platform.openExternal(parsedHref);
  }

  return (
    <a
      className={classNames(css['Root'], UNSAFE_className)}
      onClick={handleClick}
      target="_blank"
      data-test={testId}
      style={UNSAFE_style}
    >
      {children}
      <Icon UNSAFE_className={css['Icon']} icon={IconName.ExternalLink} size={IconSize.Tiny} />
    </a>
  );
}

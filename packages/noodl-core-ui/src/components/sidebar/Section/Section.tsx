import classNames from 'classnames';
import React, { ReactNode } from 'react';

import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Section.module.scss';

export enum SectionVariant {
  Default = 'default',
  Panel = 'panel',
  PanelShy = 'panel-shy',
  InModal = 'in-modal'
}

export interface SectionProps extends UnsafeStyleProps {
  variant?: SectionVariant;
  title?: string;

  hasGutter?: boolean;
  hasBottomSpacing?: boolean;
  hasVisibleOverflow?: boolean;
  hasTopDivider?: boolean;

  actions?: ReactNode;
  children?: ReactNode;
}

export function Section({
  variant = SectionVariant.Default,
  title,

  hasGutter,
  hasBottomSpacing,
  hasVisibleOverflow,
  hasTopDivider,

  actions,
  children,

  UNSAFE_className,
  UNSAFE_style
}: SectionProps) {
  return (
    <section
      className={classNames([
        css['Root'],
        css[`is-variant-${variant}`],
        hasVisibleOverflow && css['has-visible-overflow'],
        hasTopDivider && css['has-top-divider'],
        UNSAFE_className
      ])}
      style={UNSAFE_style}
    >
      {(Boolean(title) || Boolean(actions)) && (
        <div className={classNames(css['Header'], css[`is-variant-${variant}`])}>
          <Label variant={TextType.Proud} size={LabelSize.Medium}>
            {title}
          </Label>
          {Boolean(actions) && <div>{actions}</div>}
        </div>
      )}

      <div
        className={classNames([
          css['Body'],
          css[`is-variant-${variant}`],
          hasGutter && css['has-gutter'],
          hasBottomSpacing && css['has-bottom-spacing'],
          hasVisibleOverflow && css['has-visible-overflow']
        ])}
      >
        {Boolean(children) && children}
      </div>
    </section>
  );
}

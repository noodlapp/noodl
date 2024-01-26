import classNames from 'classnames';
import React from 'react';

import { Icon, IconName } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { BaseDialog } from '@noodl-core-ui/components/layout/BaseDialog';
import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import { Title } from '../../typography/Title';
import { TitleSize, TitleVariant } from '../../typography/Title/Title';
import css from './Modal.module.scss';

export interface ModalProps extends UnsafeStyleProps {
  children: Slot;

  headerSlot?: Slot;
  hasHeaderDivider?: boolean;

  footerSlot?: Slot;
  hasFooterDivider?: boolean;

  strapline?: string;
  title?: string;
  subtitle?: string;

  isVisible: boolean;

  onClose?: () => void;
}

export function Modal({
  children,
  headerSlot,
  hasHeaderDivider,
  footerSlot,
  hasFooterDivider,
  strapline,
  title,
  subtitle,
  isVisible,
  onClose,
  UNSAFE_className,
  UNSAFE_style
}: ModalProps) {
  return (
    <BaseDialog hasBackdrop isVisible={isVisible} onClose={onClose}>
      <div
        className={classNames(css['Root'], isVisible && css['is-visible'], UNSAFE_className)}
        style={UNSAFE_style}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={css['CloseButtonContainer']} data-test="close-modal-button">
          <IconButton icon={IconName.Close} onClick={onClose} variant={IconButtonVariant.Transparent} />
        </div>

        <header className={classNames(css['Header'], hasHeaderDivider && css['has-divider'])}>
          <div className={css['TitleWrapper']}>
            {strapline && <Title hasBottomSpacing>{strapline}</Title>}

            {title && (
              <Title size={TitleSize.Large} variant={TitleVariant.Highlighted} hasBottomSpacing={!!subtitle}>
                {title}
              </Title>
            )}

            {subtitle && <Title>{subtitle}</Title>}
          </div>

          {headerSlot}
        </header>

        <div className={css['Content']}>{children}</div>

        {footerSlot && (
          <footer className={classNames(css['Footer'], hasFooterDivider && css['has-divider'])}>{footerSlot}</footer>
        )}
      </div>
    </BaseDialog>
  );
}

/** @deprecated No default imports */
export default Modal;

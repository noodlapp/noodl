import useDocumentScrollTimestamp from '@noodl-hooks/useDocumentScrollTimestamp';
import useWindowSize from '@noodl-hooks/useWindowSize';
import classNames from 'classnames';
import React, { useRef, useEffect, CSSProperties, RefObject, useState, useMemo, useLayoutEffect } from 'react';

import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import { Portal } from '@noodl-core-ui/components/layout/Portal';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Slot, UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './BaseDialog.module.scss';

export enum DialogRenderDirection {
  Vertical,
  Horizontal,
  Above,
  Below
}

export enum BaseDialogVariant {
  Default = 'is-variant-default',
  Select = 'is-variant-select'
}

export enum DialogBackground {
  Default = 'is-background-default',
  Bg1 = 'is-background-bg-1',
  Bg2 = 'is-background-bg-2',
  Bg3 = 'is-background-bg-3',
  Secondary = 'is-background-secondary',
  Transparent = 'is-background-transparent'
}

export interface BaseDialogProps extends UnsafeStyleProps {
  triggerRef?: RefObject<HTMLElement>;
  renderDirection?: DialogRenderDirection;
  background?: DialogBackground;
  variant?: BaseDialogVariant;
  title?: string;

  isLockingScroll?: boolean;
  isVisible?: boolean;
  hasBackdrop?: boolean;
  hasArrow?: boolean;
  alwaysMounted?: boolean;

  children?: Slot;

  onClose?: () => void;
}

export function BaseDialog(props: BaseDialogProps) {
  const [portalRoot] = useState(document.querySelector('.dialog-layer-portal-target'));

  return (
    <Portal portalRoot={portalRoot}>
      <CoreBaseDialog {...props} />
    </Portal>
  );
}

export function CoreBaseDialog({
  triggerRef,
  renderDirection = DialogRenderDirection.Vertical,
  background = DialogBackground.Default,
  variant = BaseDialogVariant.Default,
  title,

  isLockingScroll,
  isVisible,
  hasBackdrop,
  hasArrow,
  alwaysMounted,

  children,

  onClose,

  UNSAFE_className,
  UNSAFE_style
}: BaseDialogProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useEffect(() => {
    if (!BaseDialogVariant.Select) return;
    // quick n dirty solution to make sure the
    // select doesnt render in an open state
    // without showing the animation
    setTimeout(() => {
      setIsSelectOpen(isVisible);
    }, 50);
  }, [isVisible]);

  const dialogRef = useRef<HTMLDivElement>();
  const [dialogPosition, setDialogPosition] = useState({
    x: 0,
    y: 0,
    arrowX: 0,
    arrowY: 0,
    animationStartOffsetX: 0,
    animationStartOffsetY: 0,
    width: 'auto',
    speed: 250
  });

  const windowSize = useWindowSize();
  const lastScroll = useDocumentScrollTimestamp(isVisible);

  const arrowCompensationOffset = variant === BaseDialogVariant.Select ? 0 : 12;
  const edgeOffset = 10;

  // calculate where to render the dialog
  useLayoutEffect(() => {
    if (!triggerRef?.current || !dialogRef?.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dialogRect = dialogRef.current.getBoundingClientRect();

    let dialogX;
    let dialogY;
    let arrowX;
    let arrowY;
    let animationStartOffsetX = 0;
    let animationStartOffsetY = 0;
    let width = 'auto';
    let speed = Math.max(150, dialogRect.height);

    if (variant === BaseDialogVariant.Select) width = triggerRect.width + 'px';

    function checkAboveFirst() {
      // default position to trigger is x:centered y:above
      dialogX = triggerRect.left + triggerRect.width / 2 - dialogRect.width / 2;
      dialogY = triggerRect.top - (dialogRect.height + arrowCompensationOffset);
      arrowY = dialogRect.height;
      arrowX = dialogRect.width / 2;
      animationStartOffsetY = -10;

      // if x:centered renders the dialog outside of viewport
      // we tack it to the side of the viewport it clips
      if (dialogX < 0) {
        dialogX = edgeOffset;
        arrowX = triggerRect.width / 2 + triggerRect.left - edgeOffset;
      } else if (dialogX + dialogRect.width > windowSize.width) {
        dialogX = windowSize.width - dialogRect.width - edgeOffset;
        arrowX = dialogRect.width - (windowSize.width - triggerRect.right) - triggerRect.width / 2 + edgeOffset;
      }

      // if y:above is outside the viewport we do y:below
      if (dialogY - dialogRect.height - arrowCompensationOffset < 0) {
        dialogY = triggerRect.bottom + arrowCompensationOffset;
        arrowY = 0;
        animationStartOffsetY = 10;
      }
    }

    function checkBelowFirst() {
      // default position to trigger is x:centered y:below
      dialogX = triggerRect.left + triggerRect.width / 2 - dialogRect.width / 2;
      dialogY = triggerRect.bottom + arrowCompensationOffset;
      arrowY = 0;
      arrowX = dialogRect.width / 2;
      animationStartOffsetY = 10;

      // if x:centered renders the dialog outside of viewport
      // we tack it to the side of the viewport it clips
      if (dialogX < 0) {
        dialogX = edgeOffset;
        arrowX = triggerRect.width / 2 + triggerRect.left - edgeOffset;
      } else if (dialogX + dialogRect.width > windowSize.width) {
        dialogX = windowSize.width - dialogRect.width - edgeOffset;
        arrowX = dialogRect.width - (windowSize.width - triggerRect.right) - triggerRect.width / 2 + edgeOffset;
      }

      // if y:below is outside the viewport we do y:above
      if (dialogY + dialogRect.height > windowSize.height) {
        dialogY = triggerRect.top - dialogRect.height - arrowCompensationOffset;
        arrowY = dialogRect.height;
        animationStartOffsetY = -10;
      }
    }

    function checkRightFirst() {
      // default position to trigger is y:centered x:right
      dialogX = triggerRect.right + arrowCompensationOffset;
      dialogY = triggerRect.top + triggerRect.height / 2 - dialogRect.height / 2;
      arrowX = 0;
      arrowY = dialogRect.height / 2;
      animationStartOffsetX = 10;

      // if x:right is clipping outside viewport, render as x:left
      if (dialogX + dialogRect.width > windowSize.width) {
        dialogX = triggerRect.left - dialogRect.width - arrowCompensationOffset;
        arrowX = dialogRect.width;
        animationStartOffsetX = -10;
      }

      // if y:center clips outside viewport tack it to bottom or top
      if (dialogY + dialogRect.height > windowSize.height) {
        dialogY = windowSize.height - dialogRect.height;
        arrowY = dialogRect.height - (windowSize.height - triggerRect.top) + triggerRect.height / 2;
      } else if (dialogY < 0) {
        dialogY = 10;
        arrowY = triggerRect.top + triggerRect.height / 2;
      }
    }

    switch (renderDirection) {
      case DialogRenderDirection.Vertical:
      case DialogRenderDirection.Above:
        checkAboveFirst();
        break;
      case DialogRenderDirection.Below:
        checkBelowFirst();
        break;
      case DialogRenderDirection.Horizontal:
        checkRightFirst();
        break;
    }

    setDialogPosition({
      x: dialogX,
      y: dialogY,
      arrowX,
      arrowY,
      animationStartOffsetX,
      animationStartOffsetY,
      width,
      speed
    });
  }, [isVisible, windowSize, lastScroll, triggerRef?.current, dialogRef?.current]);

  const backgroundColor = useMemo(() => {
    switch (background) {
      case DialogBackground.Bg1:
        return 'var(--theme-color-bg-1)';
      case DialogBackground.Bg2:
        return 'var(--theme-color-bg-2)';
      case DialogBackground.Bg3:
        return 'var(--theme-color-bg-3)';
      case DialogBackground.Transparent:
        return 'transparent';
      case DialogBackground.Secondary:
        return 'var(--theme-color-secondary)';
      default:
        return 'var(--theme-color-bg-4)';
    }
  }, [background]);

  const backgroundContrastColor = useMemo(() => {
    switch (background) {
      case DialogBackground.Bg1:
        return 'var(--theme-color-bg-0)';
      case DialogBackground.Bg2:
        return 'var(--theme-color-bg-1)';
      case DialogBackground.Bg3:
        return 'var(--theme-color-bg-2)';
      case DialogBackground.Transparent:
        return 'transparent';
      case DialogBackground.Secondary:
        return 'var(--theme-color-secondary)';
      default:
        return 'var(--theme-color-bg-2)';
    }
  }, [background]);

  if (!isVisible && !alwaysMounted) return null;

  return (
    <div
      className={classNames(
        css['Root'],
        hasBackdrop && css['has-backdrop'],
        isLockingScroll && css['is-locking-scroll'],
        typeof triggerRef === 'undefined' && css['is-centered'],
        !isVisible && css['is-hidden'],
        css[variant]
      )}
      onClick={onClose}
      style={
        {
          '--offsetY': `${Math.floor(dialogPosition.y)}px`,
          '--offsetX': `${Math.floor(dialogPosition.x)}px`,
          '--animationStartOffsetX': `${dialogPosition.animationStartOffsetX}px`,
          '--animationStartOffsetY': `${dialogPosition.animationStartOffsetY}px`,
          '--background': backgroundColor,
          '--backgroundContrast': backgroundContrastColor,
          '--width': dialogPosition.width
        } as CSSProperties
      }
    >
      <div
        className={classNames(css['VisibleDialog'], UNSAFE_className, isVisible && css['is-visible'], css[variant])}
        style={UNSAFE_style}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={css['MeasuringContainer']}>
          <div ref={dialogRef} style={{}} className={css['ChildContainer']}>
            {children}
          </div>
        </div>

        {hasArrow && (
          <div
            className={classNames(css['Arrow'], title && dialogPosition.arrowY === 0 && css['is-contrast'])}
            style={
              {
                '--arrow-top': `${dialogPosition.arrowY}px`,
                '--arrow-left': `${dialogPosition.arrowX}px`
              } as CSSProperties
            }
          />
        )}

        {variant === BaseDialogVariant.Select ? (
          <Collapsible isCollapsed={!isSelectOpen} transitionMs={dialogPosition.speed}>
            <div className={css['ChildContainer']}>
              {title && (
                <div className={css['Title']}>
                  <Label size={LabelSize.Medium}>{title}</Label>
                </div>
              )}
              {children}
            </div>
          </Collapsible>
        ) : (
          <div className={css['ChildContainer']}>
            {title && (
              <div className={css['Title']}>
                <Label size={LabelSize.Medium}>{title}</Label>
              </div>
            )}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

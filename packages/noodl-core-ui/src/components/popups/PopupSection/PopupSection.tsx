import { Slot } from '@noodl-core-ui/types/global';
import classNames from 'classnames';
import React, { CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import css from './PopupSection.module.scss';

/**
 * TODO:
 * - Remove style prop and replace with "isInactive" prop
 */

export interface PopupSectionProps {
  children?: Slot;
  title?: string;
  className?: string;
  maxContentHeight?: number;

  hasBottomBorder?: boolean;
  hasYPadding?: boolean;
  isCenteringChildren?: boolean;

  style?: CSSProperties;
  contentContainerStyle?: CSSProperties;
}

export function PopupSection({
  children,
  title,
  className,
  maxContentHeight,

  hasBottomBorder,
  hasYPadding,
  isCenteringChildren,

  style,
  contentContainerStyle
}: PopupSectionProps) {
  const contentRef = useRef<HTMLDivElement>();
  const [shouldScroll, setShouldScroll] = useState(false);
  const [hasBeenCalculated, setHasBeenCalculated] = useState(false);

  function checkIfShouldScroll() {
    if (!contentRef.current || !maxContentHeight) return false;
    if (contentRef.current.getBoundingClientRect().height >= maxContentHeight) return true;
    return false;
  }

  useLayoutEffect(() => {
    if (contentRef.current) {
      setShouldScroll(checkIfShouldScroll());
      setHasBeenCalculated(true);
    }
  }, [contentRef, children]);

  return (
    <section
      className={classNames([css['Root'], hasBottomBorder && css['has-bottom-border'], className])}
      style={{
        ...style,
        overflowY: hasBeenCalculated ? undefined : 'hidden',
        height: hasBeenCalculated ? undefined : 0
      }}
    >
      {title && (
        <header className={css['Header']}>
          <h2 className={css['Title']}>{title}</h2>
        </header>
      )}

      {children ? (
        <div
          className={classNames([
            css['Content'],
            hasYPadding && css['has-y-padding'],
            isCenteringChildren && css['is-centering-children']
          ])}
          ref={contentRef}
          style={{
            ...contentContainerStyle,
            height: shouldScroll ? maxContentHeight : undefined,
            // @ts-expect-error
            overflowY: shouldScroll ? 'overlay' : undefined
          }}
        >
          {children}
        </div>
      ) : (
        <div ref={contentRef} />
      )}
    </section>
  );
}

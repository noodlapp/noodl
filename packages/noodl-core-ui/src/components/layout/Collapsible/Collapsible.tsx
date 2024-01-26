import useCallAfterNextRender from '@noodl-hooks/useCallAfterNextRender';
import { CustomPropertyAnimation, useCustomPropertyValue } from '@noodl-hooks/useCustomPropertyValue';
import usePrevious from '@noodl-hooks/usePrevious';
import useTimeout from '@noodl-hooks/useTimeout';
import useWindowSize from '@noodl-hooks/useWindowSize';
import React, { useRef, useLayoutEffect, useState, useEffect, useMemo } from 'react';

import { Slot } from '@noodl-core-ui/types/global';

import css from './Collapsible.module.scss';

export interface CollapsibleProps {
  children: Slot;
  transitionMs?: number;
  easingFunction?: string;
  hasTopPadding?: boolean;
  isCollapsed: boolean;
  disableTransition?: boolean;
}

type IComponentHeight = number | 'auto';

export function Collapsible({
  children,
  transitionMs = 400,
  easingFunction,
  isCollapsed,
  disableTransition
}: CollapsibleProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const wasCollapsed = usePrevious(isCollapsed);
  const [componentHeight, setComponentHeight] = useState<IComponentHeight>('auto');
  const [hasFinishedOpening, setHasFinishedOpening] = useState(!isCollapsed);
  const [clearTimeout, setClearTimeout] = useState(false);
  const defaultEasing = useCustomPropertyValue(CustomPropertyAnimation.EasingBase);

  const easing = easingFunction || defaultEasing;

  const doAfterNextRender = useCallAfterNextRender();

  useWindowSize();

  useLayoutEffect(() => {
    doAfterNextRender(() => {
      const newHeight = Math.ceil(innerRef.current?.getBoundingClientRect().height);
      if (componentHeight !== newHeight) {
        setComponentHeight(newHeight);
      }
    });
  });

  // We calculate the full height at 0
  // so this is needed to know if the height has changed due to calculation (in which case it should not transition)
  // or if the transition should be pretty
  const doTransition = !disableTransition || wasCollapsed !== isCollapsed;

  const innerRefHeight = componentHeight || 'auto';

  let height: IComponentHeight = 'auto';
  height = isCollapsed ? 0 : innerRefHeight;

  useTimeout(
    () => {
      if (doTransition && !isCollapsed) {
        setHasFinishedOpening(true);
      }
    },
    clearTimeout ? null : transitionMs
  );

  useEffect(() => {
    if (doTransition) {
      if (isCollapsed) {
        setHasFinishedOpening(false);
        setClearTimeout(true);
      } else {
        setClearTimeout(false);
      }
    }
  }, [isCollapsed, doTransition]);

  useEffect(() => {
    if (!height || isCollapsed || !innerRef.current) return undefined;

    const resizeObserver = new ResizeObserver((el) => {
      setComponentHeight(Math.ceil(el[0].contentRect.height));
    });

    resizeObserver.observe(innerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [height, isCollapsed]);

  const overflow = useMemo(() => (hasFinishedOpening ? 'visible' : 'hidden'), [hasFinishedOpening]);

  //Unmount children if transitions are disabled. Can improve performance if there are lots of child elements
  const unmountChildren = disableTransition && isCollapsed;

  return (
    <div
      className={css['Root']}
      style={{
        height: height,
        transition: doTransition ? `height ${transitionMs}ms ${easing}` : 'none',
        overflow
      }}
    >
      <div className={css['Inner']} ref={innerRef}>
        {unmountChildren ? null : children}
      </div>
    </div>
  );
}

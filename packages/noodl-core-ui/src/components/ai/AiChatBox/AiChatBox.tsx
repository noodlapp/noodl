import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { HStack, VStack } from '@noodl-core-ui/components/layout/Stack';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';

import css from './AiChatBox.module.scss';

export interface AiChatBoxProps {
  children: Slot;
  footer: Slot;
}

export function AiChatBox({ children, footer }: AiChatBoxProps) {
  const scrollableRef = useRef<HTMLDivElement>(null);
  const scrollBottomRef = useRef<HTMLSpanElement>(null);
  const [isTracking, setIsTracking] = useState(true);
  const isTrackingRef = useRef(true);
  const lastScrollTop = useRef(0);
  const isJumpingToPresent = useRef(false);

  const onResize = useCallback(() => {
    if (isTrackingRef.current && scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (!scrollableRef.current) return;

    function handleScroll() {
      const elem = scrollableRef.current;

      if (!isJumpingToPresent.current) {
        // Remove decimals from scrollTop to make it pixel perfect
        elem.scrollTop = Math.round(elem.scrollTop);
      }

      // scrollTop can be half a pixel off, so you will never hit the bottom.
      const isAtBottom = elem.scrollTop + elem.clientHeight + 1 >= elem.scrollHeight;
      setIsTracking(isAtBottom);
      isTrackingRef.current = isAtBottom;

      lastScrollTop.current = scrollableRef.current.scrollTop;

      if (isAtBottom && isJumpingToPresent.current) {
        isJumpingToPresent.current = false;
      }
    }

    const scrollable = scrollableRef.current;
    scrollable.addEventListener('scroll', handleScroll);

    const observer = new ResizeObserver(onResize);
    observer.observe(scrollableRef.current);

    return () => {
      observer.disconnect();
      scrollable.removeEventListener('scroll', handleScroll);
    };
  }, [onResize, scrollableRef]);

  useEffect(() => {
    // Scroll to the bottom at the start
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (scrollableRef.current && !isTracking) {
      scrollableRef.current.scrollTop = lastScrollTop.current;
    }
  }, [children, isTracking]);

  function handleScrollToBottom() {
    if (scrollBottomRef.current) {
      isJumpingToPresent.current = true;
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  if (isTracking && scrollBottomRef.current) {
    requestAnimationFrame(() => {
      if (scrollBottomRef.current) {
        scrollBottomRef.current.scrollIntoView({ behavior: 'auto' });
      }
    });
  }

  return (
    <VStack UNSAFE_style={{ height: '100%', width: '100%' }}>
      <div className={css['ScrollContainer']}>
        <div className={css['ScrollArea']} ref={scrollableRef}>
          {children}
          <span ref={scrollBottomRef}></span>
        </div>

        {!isTracking && (
          <div className={css['JumpToPresentContainer']}>
            <div className={classNames(css['JumpToPresent'], css['is-past'])} onClick={handleScrollToBottom}>
              <HStack hasSpacing={1}>
                <Text>Jump To Present</Text>
                <Icon icon={IconName.ArrowDown} size={IconSize.Tiny} />
              </HStack>
            </div>
          </div>
        )}
      </div>

      {Boolean(footer) && (
        <Section hasGutter hasTopDivider hasVisibleOverflow>
          {footer}
        </Section>
      )}
    </VStack>
  );
}

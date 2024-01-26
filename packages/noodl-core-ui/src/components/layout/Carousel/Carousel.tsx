import React, { useEffect, useRef, useState } from 'react';

import { Box } from '@noodl-core-ui/components/layout/Box';
import { Center } from '@noodl-core-ui/components/layout/Center';
import { HStack, VStack } from '@noodl-core-ui/components/layout/Stack';
import { Slot } from '@noodl-core-ui/types/global';

import css from './Carousel.module.scss';

export interface CarouselIndicatorBaseProps {
  isActive: boolean;
  onClick: () => void;
}

interface BaseCarouselProps {
  activeIndex?: number;
  items: { slot: Slot }[];
}

export interface CarouselProps extends BaseCarouselProps {
  indicator: React.FunctionComponent<CarouselIndicatorBaseProps>;
}

export function Carousel({ activeIndex, items, indicator }: CarouselProps) {
  const sliderRefs = useRef<HTMLDivElement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(activeIndex || 0);

  useEffect(() => {
    setCurrentIndex(activeIndex);

    if (sliderRefs.current[activeIndex]) {
      sliderRefs.current[activeIndex].scrollIntoView({
        behavior: 'auto'
      });
    }
  }, [activeIndex]);

  if (typeof currentIndex === 'number' && sliderRefs.current[currentIndex]) {
    sliderRefs.current[currentIndex].scrollIntoView({
      behavior: 'smooth'
    });
  }
  return (
    <div className={css['Root']}>
      <div style={{ overflow: 'hidden' }}>
        <HStack UNSAFE_style={{ width: items.length * 100 + '%' }}>
          {items.map((item, index) => (
            <VStack key={index} ref={(ref) => (sliderRefs.current[index] = ref)} UNSAFE_style={{ width: '100%' }}>
              {item.slot}
            </VStack>
          ))}
        </HStack>
      </div>

      {indicator && (
        <Box hasTopSpacing>
          <Center>
            <HStack hasSpacing={2}>
              {items.map((_, index) =>
                React.createElement(indicator, {
                  key: index,
                  isActive: index === currentIndex,
                  onClick() {
                    setCurrentIndex(index);
                  }
                })
              )}
            </HStack>
          </Center>
        </Box>
      )}
    </div>
  );
}

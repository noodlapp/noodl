import React, { useMemo, useState } from 'react';
import { platform } from '@noodl/platform';

import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';

import { HtmlRenderer } from '@noodl-core-ui/components/common/HtmlRenderer';
import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { BaseDialog } from '@noodl-core-ui/components/layout/BaseDialog';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import { Text } from '@noodl-core-ui/components/typography/Text';

import css from './NewsModal.module.scss';

export interface NewsModalProps {
  content: string;
  onFinished: () => void;
}

export function NewsModal({ content, onFinished }: NewsModalProps) {
  const [isVisible, setIsVisible] = useState(undefined);
  const [activeSlide, setActiveSlide] = useState(0);
  const host = getDocsEndpoint();
  const version = platform.getVersion();

  const parsedContent = useMemo(() => {
    const parseContainer = document.createElement('div');
    parseContainer.innerHTML = content;

    const images = Array.from(parseContainer.querySelectorAll('img'));
    images.forEach((image) => {
      const src = image.getAttribute('src');
      image.src = host + src;

      image.removeAttribute('width');
      image.removeAttribute('height');
    });

    const slides = Array.from(parseContainer.querySelectorAll('section'));

    if (images.length) {
      const loadTrigger = document.createElement('img');
      loadTrigger.onload = () => setIsVisible(true);
      loadTrigger.src = images[0].src;
    } else {
      setIsVisible(true);
    }

    if (slides.length) return slides.map((slide) => slide.innerHTML);

    return [parseContainer.innerHTML];
  }, [content]);

  const isOnLastSlide = activeSlide >= parsedContent.length - 1;
  const nextButton = isOnLastSlide
    ? {
        label: 'Got it',
        onClick: () => {
          setIsVisible(false);
          onFinished();
        }
      }
    : {
        label: 'Next',
        onClick: () => setActiveSlide((val) => val + 1)
      };

  if (typeof isVisible === 'undefined') return null;

  return (
    <BaseDialog
      isVisible={isVisible}
      hasBackdrop
      onClose={() => setIsVisible(false)}
      UNSAFE_className={css['Background']}
    >
      <div className={css['Root']}>
        <div className={css['Header']}>
          <Text>New updates in {version}</Text>
        </div>
        <div className={css['Inner']}>
          {parsedContent.map((slide, i) => (
            <Collapsible key={i} isCollapsed={i !== activeSlide}>
              <HtmlRenderer html={slide} />
            </Collapsible>
          ))}

          <div className={css['Nav']}>
            <PrimaryButton
              label={nextButton.label}
              onClick={() => nextButton.onClick()}
              UNSAFE_className={css['Button']}
            />
          </div>
        </div>
      </div>
    </BaseDialog>
  );
}

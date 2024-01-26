import classNames from 'classnames';
import React, { ReactChild, ReactNode, useEffect, useState } from 'react';
import { NodeType } from '@noodl-constants/NodeType';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';

import css from './NodePickerCategory.module.scss';
import { CustomPropertyAnimation, useCustomPropertyValue } from '@noodl-hooks/useCustomPropertyValue';
import { Title, TitleSize, TitleVariant } from '@noodl-core-ui/components/typography/Title';
import { Text, TextSize, TextType } from '@noodl-core-ui/components/typography/Text';

interface NodePickerCategoryProps {
  title: string;
  description: string;
  type?: NodeType | NodeColor;
  children: ReactNode;

  isKeyboardCursored?: boolean;
  isCollapsed?: boolean;

  disableTransition?: boolean;
}

export default function NodePickerCategory({
  title,
  description,
  children,
  type = NodeType.Visual,

  isKeyboardCursored,
  isCollapsed,

  disableTransition
}: NodePickerCategoryProps) {
  const transitionSpeed = useCustomPropertyValue(CustomPropertyAnimation.SpeedQuick);
  const descriptionEasingFunction = useCustomPropertyValue(CustomPropertyAnimation.EasingEqual);
  const [isCollapsedState, setIsCollapsedState] = useState(isCollapsed);
  const [isHighlightedState, setIsHighlightedState] = useState(isKeyboardCursored);

  useEffect(() => {
    setIsHighlightedState(isKeyboardCursored);
  }, [isKeyboardCursored]);

  useEffect(() => {
    setIsCollapsedState(isCollapsed);
  }, [isCollapsed]);

  function addHighlight() {
    setIsHighlightedState(true);
  }

  function removeHighlight() {
    setIsHighlightedState(false);
  }

  return (
    <section
      className={classNames(
        css['Root'],
        css[`Root--is-theme-${type}`],
        isHighlightedState && css['Root--is-highlighted']
      )}
      onMouseEnter={addHighlight}
      onMouseLeave={removeHighlight}
    >
      <header
        className={classNames([css['Header'], css[`Header--is-theme-${type}`]])}
        onClick={() => setIsCollapsedState(!isCollapsedState)}
      >
        <Title variant={TitleVariant.Highlighted} size={TitleSize.Medium}>
          {title}
        </Title>

        <Collapsible
          isCollapsed={!isCollapsedState}
          transitionMs={transitionSpeed * 0.5}
          disableTransition={disableTransition}
          easingFunction={descriptionEasingFunction}
        >
          <Text textType={TextType.Default} size={TextSize.Medium}>
            {description}
          </Text>
        </Collapsible>

        <img
          className={classNames([
            css['Arrow'],
            isCollapsedState ? css['Arrow--is-collapsed'] : css['Arrow--is-not-collapsed']
          ])}
          src="../assets/icons/editor/right_arrow_22.svg"
        />
      </header>

      <Collapsible isCollapsed={isCollapsedState} transitionMs={transitionSpeed} disableTransition={disableTransition}>
        <div>{children}</div>
      </Collapsible>
    </section>
  );
}

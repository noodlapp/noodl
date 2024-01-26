import { Text, TextSize, TextType } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize } from '@noodl-core-ui/components/typography/Title';
import classNames from 'classnames';
import React, { useState } from 'react';

import css from './NodePickerOtherItem.module.scss';

interface NodePickerOtherItemProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onClick: (e?: React.MouseEvent<HTMLElement>) => void;
}

export default function NodePickerOtherItem({ title, description, icon, onClick }: NodePickerOtherItemProps) {
  const [isHighlightedState, setIsHighlightedState] = useState(false);

  function addHighlight() {
    setIsHighlightedState(true);
  }

  function removeHighlight() {
    setIsHighlightedState(false);
  }

  return (
    <section
      className={classNames(css['Root'], isHighlightedState && css['Root--is-highlighted'])}
      onMouseEnter={addHighlight}
      onMouseLeave={removeHighlight}
    >
      <header className={classNames(css['Header'])} onClick={onClick}>
        {icon ? icon : null}
        <div style={{ marginLeft: icon ? '10px' : 0 }}>
          <Title size={TitleSize.Medium}>{title}</Title>
          <Text textType={TextType.Shy} size={TextSize.Medium}>
            {description}
          </Text>
        </div>
      </header>
    </section>
  );
}

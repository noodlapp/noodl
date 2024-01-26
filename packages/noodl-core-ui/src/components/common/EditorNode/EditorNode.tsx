import classNames from 'classnames';
import React, { CSSProperties } from 'react';

import { INodeType, INodeColorScheme } from '@noodl-types/nodeTypes';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';

import css from './EditorNode.module.scss';

export interface EditorNodeProps {
  item: INodeType;
  colors: INodeColorScheme;
  isHighlighted?: boolean;
}

function nodeNameToIconName(itemName: INodeType['name']) {
  switch (itemName) {
    case 'Group':
      return IconName.Group;
    case 'Text':
      return IconName.TextInBox;
    case 'Image':
      return IconName.Image;
    case 'Video':
      return IconName.Video;
    case 'Circle':
      return IconName.CircleOpen;
    case 'net.noodl.visual.icon':
      return IconName.Icon;
    case 'net.noodl.controls.button':
      return IconName.Button;
    case 'net.noodl.controls.checkbox':
      return IconName.CheckboxFilled;
    case 'net.noodl.controls.options':
      return IconName.DropdownLines;
    case 'net.noodl.controls.radiobutton':
      return IconName.Radiobutton;
    case 'Radio Button Group':
      return IconName.RadiobuttonGroup;
    case 'net.noodl.controls.range':
      return IconName.SlidersFilled;
    case 'net.noodl.controls.textinput':
      return IconName.TextInput;
    case 'net.noodl.visual.columns':
      return IconName.Columns;
    default:
      return null;
  }
}

export function EditorNode({ item, colors, isHighlighted }: EditorNodeProps) {
  const iconName = nodeNameToIconName(item.name);

  return (
    <div
      className={classNames([css['Root'], isHighlighted && css['is-highlighted']])}
      style={
        {
          '--textColor': colors.text,
          '--baseColor': colors.headerHighlighted,
          '--highlightColor': colors.baseHighlighted
        } as CSSProperties
      }
    >
      {iconName && <Icon icon={iconName} size={IconSize.Small} />}
      <span className={classNames(css['Label'], iconName && css['is-after-icon'])}>
        {item.displayName || item.displayNodeName || item.name}
      </span>
    </div>
  );
}

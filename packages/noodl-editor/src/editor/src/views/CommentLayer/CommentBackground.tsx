import React from 'react';

import { CommentFillStyle } from './CommentLayerView';

function CommentBackground(props) {
  const transform = `translate(${props.x}px, ${props.y}px)`;
  const colorStyle = { backgroundColor: undefined, borderColor: undefined };

  const isFilled =
    props.fill === true || props.fill === CommentFillStyle.Filled || props.fill === CommentFillStyle.Transparent;

  let fillType;

  if (props.fill === true || props.fill === CommentFillStyle.Transparent) {
    fillType = CommentFillStyle.Transparent;
  } else {
    fillType = props.fill || CommentFillStyle.Outline;
  }

  if (isFilled) {
    //extract the hex value from the variable and append opacity
    const variableName = props.color.base.substring(4, props.color.base.length - 1);
    const color = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

    const opacity =
      fillType === CommentFillStyle.Transparent ? Math.floor(props.color.darkerOpacity * 255).toString(16) : 'ff';
    colorStyle.backgroundColor = `${color}${opacity}`;
  } else {
    colorStyle.borderColor = props.color.base;
  }

  return (
    <div
      className={`comment-layer-comment background
      ${props.selected ? 'selected' : ''}
      ${fillType}
      ${props.largeFont ? 'large-font' : ''}
      ${props.annotation ? 'has-annotation ' + props.annotation : ''}`}
      style={{
        ...colorStyle,
        width: props.width,
        height: props.height,
        transform
      }}
    >
      {!props.showTextArea ? <div className="content">{props.text}</div> : null}
    </div>
  );
}

const MemoizedCommentBackground = React.memo(CommentBackground);

export { MemoizedCommentBackground as CommentBackground };

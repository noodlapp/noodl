import React from 'react';

import { CommentBackground } from './CommentBackground';
import { CommentForeground } from './CommentForeground';
import './CommentLayer.css';

export enum CommentFillStyle {
  Filled = 'fill',
  Transparent = 'transparent',
  Outline = 'no-fill'
}

const colors = {
  logic: { base: 'var(--theme-color-node-logic-3)', darkerOpacity: 0.3 },
  script: { base: 'var(--theme-color-node-custom-3)', darkerOpacity: 0.3 },
  data: { base: 'var(--theme-color-node-data-3)', darkerOpacity: 0.3 },
  visual: { base: 'var(--theme-color-node-visual-3)', darkerOpacity: 0.3 },
  component: {
    base: 'var(--theme-color-node-component-3)',
    darkerOpacity: 0.3
  },
  success: {
    base: 'var(--theme-color-success-dark)',
    darkerOpacity: 0.3
  },
  comment: {
    base: 'var(--theme-color-secondary-highlight)',
    darkerOpacity: 0.3
  },
  danger: {
    base: 'var(--theme-color-danger-dark)',
    darkerOpacity: 0.3
  },
  notice: {
    base: 'var(--theme-color-notice-dark)',
    darkerOpacity: 0.3
  }
};

const defaultColorName = Object.keys(colors)[0];

function CommentsForeground(props) {
  if (props.scale === undefined) {
    //react-dnd requires "scale" to be set when this mountes. It does special setup work on mount to figure out the realtion to any parent transform
    //and adding scale after mount breaks react-dnd
    return null;
  }

  return (
    <div className="comment-layer-comments">
      {props.comments.map((c, i) => {
        const active = props.activeCommentId === c.id;
        const selected = props.selectedIds.includes(c.id);

        const colorName = c.color && colors[c.color] ? c.color : defaultColorName;

        return (
          <CommentForeground
            key={c.id}
            {...c}
            readOnly={props.readOnly}
            scale={props.scale}
            color={colorName}
            colors={colors}
            updateComment={(changedProps, args) => props.updateComment(c.id, changedProps, args)}
            onResizeStart={props.onResizeStart}
            onResizeStop={props.onResizeStop}
            removeComment={() => props.removeComment(c.id)}
            selected={selected}
            active={active}
            showTextArea={active && props.showTextArea}
            toggleSelection={() => props.toggleSelection(c.id)}
            setActive={(active) => {
              if (active) {
                props.setActiveState(c.id, true);
              } else {
                props.setActiveState(c.id, false);
              }
            }}
            setShowTextArea={props.setShowTextArea}
            isContextOpen={props.isContextOpen}
            setIsContextOpen={props.setIsContextOpen}
          />
        );
      })}
    </div>
  );
}

function CommentsBackground(props) {
  return (
    <div className="comment-layer-comments">
      {props.comments.map((c, i) => {
        const colorName = c.color && colors[c.color] ? c.color : defaultColorName;
        const active = props.activeCommentId === c.id;
        const selected = props.selectedIds.includes(c.id);

        return (
          <CommentBackground
            key={c.id}
            {...c}
            color={colors[colorName]}
            selected={selected}
            showTextArea={active && props.showTextArea}
          />
        );
      })}
    </div>
  );
}

export { CommentsBackground as Background, CommentsForeground as Foreground };

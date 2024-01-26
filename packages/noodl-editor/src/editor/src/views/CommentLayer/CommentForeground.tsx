import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Rnd } from 'react-rnd';

import { FeedbackType } from '@noodl-constants/FeedbackType';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonSize } from '@noodl-core-ui/components/inputs/IconButton';
import { BaseDialog, DialogBackground } from '@noodl-core-ui/components/layout/BaseDialog';
import { ContextMenu } from '@noodl-core-ui/components/popups/ContextMenu';

import PopupLayer from '../popuplayer';
import { CommentFillStyle } from './CommentLayerView';

function getColor(props) {
  const color = props.colors[props.color];
  return color ? color : props.colors[Object.keys(props.colors)[0]];
}

function setTextAreaToContentHeight(textArea) {
  //figure out max height by looking at parent. This will be the correct size with padding
  const maxHeight = textArea.parentNode.clientHeight;

  textArea.style.height = '';
  const newHeight = Math.min(maxHeight, textArea.scrollHeight);
  textArea.style.height = newHeight + 'px';
}

function useTextAreaInitOnMount() {
  return useCallback((textArea) => {
    if (textArea === null) {
      return;
    }

    //auto focus
    textArea.focus();
    //and move cursor to the end
    textArea.setSelectionRange(textArea.value.length, textArea.value.length);

    //set the textarea height
    setTextAreaToContentHeight(textArea);

    //and scroll to end
    textArea.scrollTop = textArea.scrollHeight;
  }, []);
}

function CommentTextArea(props) {
  const textAreaCb = useTextAreaInitOnMount();
  const [text, setText] = useState(props.text);
  const [textDirty, setTextDirty] = useState(false);

  const textRef = useRef(props.text);

  //commit the text to the comment model when this unmounts, and the text has changed
  //onBlur might not always get called for some reason, so let's rely on unmount instead (might be that onBlur doesn't happen if this component unmounts at the same time as the blur event is sent)
  //we need to save the text in a ref, since we don't want the effect to commit to the model every time the text updates, but we need the latest
  //text on unmount
  //This is all to make undo work like expected, so you don't undo one letter at a time
  useEffect(() => {
    return () => {
      if (textDirty) {
        props.updateComment({ text: textRef.current }, { commit: true, label: 'change comment text' });
      }
    };
  }, [textDirty]);

  return (
    <textarea
      rows={1} //make sure the textarea wraps the text without extra padding
      onBlur={(e) => {
        props.setShowTextArea(false);
      }}
      spellCheck={false}
      onMouseDown={(e) => e.stopPropagation()} //prevent dragging
      ref={textAreaCb}
      value={text}
      onChange={(e) => {
        setTextDirty(true);
        setTextAreaToContentHeight(e.target);
        setText(e.target.value);
        textRef.current = e.target.value;
      }}
    />
  );
}

function CommentForeground(props) {
  const [dragStartFired, setDragStartFired] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!props.annotation) {
      return;
    }

    if (hover) {
      const text = props.annotation[0].toUpperCase() + props.annotation.slice(1);
      PopupLayer.instance.showTooltip({
        attachTo: $(ref.current),
        position: 'bottom',
        content: text
      });
    } else {
      PopupLayer.instance.hideTooltip();
    }
  }, [hover, props.annotation]);

  return (
    <Rnd
      enableResizing={!props.readOnly}
      disableDragging={props.readOnly}
      className={`comment-layer-comment foreground ${props.largeFont ? 'large-font' : ''}`}
      dragHandleClassName="comment-drag-area"
      scale={props.scale}
      size={{ width: props.width, height: props.height }}
      position={{ x: props.x, y: props.y }}
      onDragStart={() => setDragStartFired(false)} //note: this event gets called on mouse down, not when the drag actually starts. So let's make out own event with onDrag() and some state
      onDragStop={(e, d) => {
        //note: this get's called on mouse up, even if position hasn't changed
        props.updateComment({ x: d.x, y: d.y }, { commit: true, label: 'change comment position' });
        props.onResizeStop();
      }}
      onDrag={(e, d) => {
        if (!dragStartFired) {
          props.onResizeStart();
          setDragStartFired(true);
        }
        props.updateComment({ x: d.x, y: d.y });
        props.setActive(false);
      }}
      minWidth={100}
      minHeight={30}
      onResizeStart={props.onResizeStart}
      onResizeStop={(e, direction, ref, delta, pos) => {
        props.updateComment({ x: pos.x, y: pos.y }, { commit: true });
        props.updateComment(
          { width: Number(ref.style.width.slice(0, -2)), height: Number(ref.style.height.slice(0, -2)) },
          { commit: true, label: 'change comment size' }
        );
        props.onResizeStop();
      }}
      onResize={(e, direction, ref, delta, pos) => {
        props.updateComment({
          x: pos.x,
          y: pos.y,
          width: Number(ref.style.width.slice(0, -2)),
          height: Number(ref.style.height.slice(0, -2))
        });
      }}
    >
      <div
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="comment-drag-area"
        tabIndex={1}
        onBlur={(event) => {
          // deselect the comment if the blir event isn't bubbling up from a child
          // or if a context menu is open
          if (event.currentTarget.contains(event.relatedTarget)) return;
          if (props.isContextOpen) return;

          props.setActive(false);
        }}
        onClick={(e) => {
          if (props.readOnly) {
            return;
          }

          if (e.shiftKey) {
            props.toggleSelection();
          } else {
            if (props.active) {
              props.setShowTextArea(true);
            } else {
              props.setActive(true);
            }
          }
        }}
      >
        {props.active ? <CommentControls {...props} /> : null}
        {props.showTextArea ? <CommentTextArea {...props} /> : null}
      </div>
    </Rnd>
  );
}

function CommentControls(props) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef();

  const color = getColor(props);

  return (
    <div
      className="comment-controls"
      onClick={(e) => e.stopPropagation()} //block react-rnd from kicking in
      onMouseDown={(e) => e.stopPropagation()} //block react-rnd from kicking in
    >
      <BaseDialog
        hasArrow
        isVisible={showColorPicker}
        background={DialogBackground.Bg3}
        triggerRef={colorPickerRef}
        onClose={() => {
          setShowColorPicker(false);
          props.setIsContextOpen(false);
        }}
        isLockingScroll
      >
        <ColorPicker
          colors={props.colors}
          color={props.color}
          onColorSelected={(c) => props.updateComment({ color: c }, { commit: true, label: 'change comment color' })}
        />
      </BaseDialog>

      <div
        className="comment-color-picker-icon-parent"
        ref={colorPickerRef}
        onFocus={() => {
          setShowColorPicker(true);
          props.setIsContextOpen(true);
        }}
        tabIndex={3}
      >
        <div className="comment-color-picker-icon" style={{ backgroundColor: color.base }}></div>
      </div>

      <ContextMenu
        icon={IconName.Square}
        size={IconSize.Default}
        buttonSize={IconButtonSize.Bigger}
        onOpen={() => props.setIsContextOpen(true)}
        onClose={() => props.setIsContextOpen(false)}
        menuItems={[
          {
            label: 'Filled',
            icon: IconName.SquareFilled,
            isDisabled: props.fill === CommentFillStyle.Filled,
            dontCloseMenuOnClick: true,
            onClick: (e) => {
              props.updateComment(
                {
                  fill: CommentFillStyle.Filled
                },
                { commit: true, label: 'change comment fill' }
              );
            }
          },
          {
            label: 'Transparent',
            icon: IconName.SquareHalf,
            isDisabled: props.fill === CommentFillStyle.Transparent,
            dontCloseMenuOnClick: true,
            onClick: () =>
              props.updateComment(
                {
                  fill: CommentFillStyle.Transparent
                },
                { commit: true, label: 'change comment fill' }
              )
          },
          {
            label: 'Outline',
            icon: IconName.Square,
            isDisabled: props.fill === CommentFillStyle.Outline,
            dontCloseMenuOnClick: true,
            onClick: () =>
              props.updateComment(
                {
                  fill: CommentFillStyle.Outline
                },
                { commit: true, label: 'change comment fill' }
              )
          }
        ]}
      />

      <IconButton
        icon={IconName.TextInBox}
        buttonSize={IconButtonSize.Bigger}
        onClick={() =>
          props.updateComment(
            { largeFont: props.largeFont ? false : true },
            { commit: true, label: 'change comment font' }
          )
        }
      />

      <IconButton
        icon={IconName.Trash}
        iconVariant={FeedbackType.Danger}
        buttonSize={IconButtonSize.Bigger}
        onClick={props.removeComment}
      />
    </div>
  );
}

function ColorPicker(props) {
  return (
    <div className="comment-color-picker" tabIndex={2} onBlur={props.onBlur}>
      {Object.keys(props.colors).map((colorName) => {
        const color = props.colors[colorName];
        return (
          <div
            key={colorName}
            className={props.color === colorName ? 'active' : undefined}
            style={{ backgroundColor: color.base }}
            onClick={(e) => {
              e.stopPropagation();
              props.onColorSelected(colorName);
            }}
          />
        );
      })}
    </div>
  );
}

export { CommentForeground };

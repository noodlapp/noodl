import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import { INodeType, INodeColorScheme } from '@noodl-types/nodeTypes';
import { EditorNode } from '@noodl-core-ui/components/common/EditorNode';

// TODO: Move this interface somewhere better

interface NodePickerNodeProps {
  item: INodeType;
  isKeyboardCursored?: boolean;

  doCreateSelectedNode: boolean;

  onClick?: (type: INodeType) => void;
  onGetDocs?: (type: INodeType) => void;
  onMouseLeave?: () => void;
}

export default function NodePickerNode({
  item,
  isKeyboardCursored,

  doCreateSelectedNode,

  onClick,
  onGetDocs,
  onMouseLeave
}: NodePickerNodeProps) {
  const [isHighlightedState, setIsHighlightedState] = useState(isKeyboardCursored);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsHighlightedState(isKeyboardCursored);

    if (isKeyboardCursored) {
      rootRef?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isKeyboardCursored]);

  useEffect(() => {
    if (isHighlightedState) {
      onGetDocs(item);
    }
  }, [isHighlightedState]);

  useEffect(() => {
    if (isHighlightedState && doCreateSelectedNode && isKeyboardCursored) {
      handleClick();
    }
  }, [doCreateSelectedNode]);

  function handleMouseEnter() {
    setIsHighlightedState(true);
  }

  function handleMouseLeave() {
    setIsHighlightedState(false);
    onMouseLeave();
  }

  function handleClick() {
    onClick(item);
  }

  const colors: INodeColorScheme = useMemo(() => NodeLibrary.instance.colorSchemeForNodeType(item), [item]);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick} ref={rootRef}>
      <EditorNode item={item} colors={colors} isHighlighted={isHighlightedState} />
    </div>
  );
}

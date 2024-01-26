import React from 'react';
import { ICursorState } from '../../NodePicker.reducer';
import NodePickerNode from '../NodePickerNode';
import { INodeType } from '@noodl-types/nodeTypes';
import css from './NodePickerNodeGroup.module.scss';

interface NodePickerNodeGroupProps {
  items: TSFixme[];
  parentCategoryName: string;

  doCreateSelectedNode: boolean;

  cursorState: ICursorState;
  nodeCursorMatcher: (cursorState: ICursorState, categoryName: string, nodeName: string) => boolean;

  onGetDocs: (type: INodeType) => void;
  onMouseLeaveNode: () => void;
  onCreateNode: (type: INodeType) => void;
}

export default function NodePickerNodeGroup({
  items,
  parentCategoryName,
  doCreateSelectedNode,
  cursorState,
  nodeCursorMatcher,
  onGetDocs,
  onMouseLeaveNode,
  onCreateNode
}: NodePickerNodeGroupProps) {
  if (!items.length) return null;

  return (
    <ul className={css['Root']}>
      {items.map((item) => (
        <li key={item.name} className={css['ItemContainer']}>
          <NodePickerNode
            item={item}
            isKeyboardCursored={nodeCursorMatcher(cursorState, parentCategoryName, item.name)}
            doCreateSelectedNode={doCreateSelectedNode}
            onClick={onCreateNode}
            onGetDocs={onGetDocs}
            onMouseLeave={onMouseLeaveNode}
          />
        </li>
      ))}
    </ul>
  );
}

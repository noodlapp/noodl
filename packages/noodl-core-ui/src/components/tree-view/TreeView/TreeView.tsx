import classNames from 'classnames';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import css from './TreeView.module.scss';

export interface TreeViewItem<TSelf extends TreeViewItem<TSelf>> {
  id: string | number;
  isExpanded?: boolean;
  children?: TSelf[];
}
export interface SimpleTreeViewItem extends TreeViewItem<SimpleTreeViewItem> {}

const TreeViewContext = createContext<{
  dropElement: HTMLElement;
  setDropElement: (value: HTMLElement) => void;
  dropSpot: string;
  setDropSpot: (value: string) => void;
  drop: (sourceId: string, destinationId: string) => void;
  activeItemId: number | string | null;
  setActiveItemId: React.Dispatch<number | string | null>;
}>({
  dropElement: null,
  setDropElement: null,
  dropSpot: null,
  setDropSpot: null,
  drop: null,
  activeItemId: null,
  setActiveItemId: null
});

export function useTreeViewContext() {
  const context = useContext(TreeViewContext);

  if (context === undefined) {
    throw new Error('useTreeViewContext must be a child of a TreeView node');
  }

  return context;
}

export interface TreeViewChildProps<TNode extends TreeViewItem<TNode>> {
  depth: number;
  item: TNode;
  children: JSX.Element[];
  onClick: () => void;
}

export interface TreeViewProps<TNode extends TreeViewItem<TNode>> {
  items: TNode[];
  node?: (args: TreeViewChildProps<TNode>) => JSX.Element;

  onChanged?: (items: TNode[]) => void;
  onItemClick?: (item: TNode) => void;
  onItemDrop?: (sourceId: string, destinationId: string) => void;
}

// NOTE: This is required to be able to use the context inside the nodes.
interface TreeViewVisualProps<TNode extends TreeViewItem<TNode>> {
  items: TNode[];
  node?: (args: TreeViewChildProps<TNode>) => JSX.Element;
  onItemClick?: (item: TNode) => void;
}
function TreeViewVisual<TNode extends TreeViewItem<TNode>>({
  items,
  node,
  onItemClick
}: TreeViewVisualProps<TNode>) {
  function recursive(depth: number, children: TNode[]) {
    return children.map((child) =>
      React.createElement(node, {
        depth,
        item: child,
        children: recursive(depth + 1, (child.children || []) as TNode[]),
        onClick: () => onItemClick(child)
      })
    );
  }

  return <div className={classNames([css['Root']])}>{recursive(0, items)}</div>;
}

export function TreeViewItemDraggable({ id, className, onClick, children }) {
  const context = useTreeViewContext();

  return (
    <div
      className={classNames([className, css['TreeViewItemDraggable']])}
      onClick={onClick}
      data-id={id}
      draggable
      onDragStart={(eventObject) => {
        // TODO: This can probably be placed in dataTransfer instead
        context.setDropElement(eventObject.target as HTMLElement);

        // TODO: Make it easier to set data
        eventObject.dataTransfer.setData('noodl/draggable-id', id);
      }}
      onDragEnd={() => {
        context.setDropSpot(null);
      }}
      onDragOver={(eventObject) => {
        if (!!eventObject.dataTransfer.getData('noodl/draggable-id')) {
          return;
        }

        eventObject.dataTransfer.dropEffect = 'move';
        eventObject.preventDefault();

        if (eventObject.target) {
          // @ts-ignore
          const targetId = eventObject.target.getAttribute('data-id');
          context.setDropSpot(targetId || null);
        }
      }}
      onDrop={(eventObject) => {
        eventObject.preventDefault();

        const sourceId = eventObject.dataTransfer.getData('noodl/draggable-id');

        // @ts-ignore
        const destinationId = eventObject.target.getAttribute('data-id');

        context.drop(sourceId, destinationId);
      }}
    >
      {children}
    </div>
  );
}

export function TreeView<TNode extends TreeViewItem<TNode>>({
  items,
  node,
  onChanged,
  onItemClick,
  onItemDrop
}: TreeViewProps<TNode>) {
  const [, setTime] = useState(Date.now());
  const [dropElement, setDropElement] = useState(null);
  const [dropSpot, setDropSpot] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);

  const [internal_items, setItems] = useState(() => items);
  useEffect(() => setItems(items), [items]);

  const onItemClickCallback = useCallback(
    (item) => {
      let updated = false;
      onItemClick &&
        onItemClick(
          new Proxy(item, {
            set(obj, prop, value) {
              obj[prop] = value;
              updated = true;
              return true;
            }
          })
        );

      if (updated) {
        setTime(Date.now());
        onChanged && onChanged(internal_items);
      }
    },
    [internal_items, onChanged, onItemClick]
  );

  const onItemDropCallback = useCallback(
    (sourceId, destinationId) => {
      console.log(sourceId, destinationId);
      onItemDrop && onItemDrop(sourceId, destinationId);
    },
    [onItemDrop]
  );

  return (
    <TreeViewContext.Provider
      value={{
        dropElement,
        setDropElement,
        dropSpot,
        setDropSpot,
        drop: onItemDropCallback,
        activeItemId,
        setActiveItemId
      }}
    >
      <TreeViewVisual items={internal_items} node={node} onItemClick={onItemClickCallback} />
    </TreeViewContext.Provider>
  );
}

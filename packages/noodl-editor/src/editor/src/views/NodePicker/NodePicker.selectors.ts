import { ICursorState } from './NodePicker.reducer';

export function getCursoredCategory(cursorState: ICursorState) {
  return cursorState?.allCategories?.[cursorState.categoryCursor];
}

export function getCursoredNode(cursorState: ICursorState) {
  return cursorState?.allCategories?.[cursorState.categoryCursor]?.nodes?.[cursorState.nodeCursor];
}

export function getIsCategoryCursorMatchingCategory(cursorState: ICursorState, categoryName: string) {
  return getCursoredCategory(cursorState)?.name === categoryName;
}

export function getIsNodeCursorMatchingNode(cursorState: ICursorState, categoryName: string, nodeName: string) {
  return (
    getIsCategoryCursorMatchingCategory(cursorState, categoryName) && getCursoredNode(cursorState)?.name === nodeName
  );
}

export function getIsCategoryCollapsed(cursorState: ICursorState, categoryName: string) {
  const category = cursorState?.allCategories.find((category) => category.name === categoryName);

  return category ? category.isCollapsed : true;
}

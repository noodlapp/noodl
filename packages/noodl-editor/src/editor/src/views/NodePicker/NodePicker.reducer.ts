export enum CursorContext {
  Search = 'search',
  Category = 'category',
  Node = 'node'
}

export interface ICursorState {
  categoryCursor: number | null;
  nodeCursor: number | null;
  cursorContext: CursorContext;
  allowNodeCreation: boolean;
  disableCollapseTransition: boolean;
  allCategories: Array<{ name: string; isCollapsed: boolean; nodes: any[] }>;
}

export enum CursorActionType {
  MoveCursor = 'MOVE_CURSOR',
  MoveCategoryCursor = 'MOVE_CATEGORY_CURSOR',
  MoveNodeCursor = 'MOVE_NODE_CURSOR',
  HandleEnter = 'HANDLE_ENTER',
  OpenAllCategories = 'OPEN_ALL_CATEGORIES',
  CloseAllCategories = 'CLOSE_ALL_CATEGORIES',
  UpdateAllCurrentCategories = 'UPDATE_ALL_CURRENT_CATEGORIES',
  HighlightFirstNode = 'HIGHLIGHT_FIRST_NODE',
  HandleSearchUpdate = 'HANDLE_SEARCH_UPDATE',
  AfterNodeCreation = 'AFTER_NODE_CREATION',
  EnterSearchContext = 'ENTER_SEARCH_CONTEXT',
  DisableCollapseTransition = 'DISABLE_COLLAPSE_TRANSITION',
  EnableCollapseTransition = 'ENABLE_COLLAPSE_TRANSITION'
}

function moveCategoryCursor(state: ICursorState, skip: number): ICursorState {
  const calculatedValue = state.categoryCursor + skip;
  let targetValue;
  let targetNodeCursor = null;
  let targetCursorContext = CursorContext.Category;

  if (state.categoryCursor === null && skip > 0) {
    targetValue = 0;
  } else if (calculatedValue > state.allCategories.length - 1) {
    targetValue = state.allCategories.length - 1;
  } else if (calculatedValue < 0) {
    return enterSearchContext(state);
  } else {
    targetValue = calculatedValue;

    if (targetValue < state.categoryCursor) {
      const previousCategory = state.allCategories[targetValue];

      // enter node context if prev cat is not collapsed
      if (!previousCategory.isCollapsed) {
        const nodeCursorModifier = previousCategory.nodes.length % 2 ? 1 : 2; // wow, such mathematical
        targetNodeCursor = previousCategory.nodes.length - nodeCursorModifier;
        targetCursorContext = CursorContext.Node;
      }
    }
  }

  return {
    ...state,
    categoryCursor: targetValue,
    cursorContext: targetCursorContext,
    nodeCursor: targetNodeCursor
  };
}

function moveNodeCursor(state: ICursorState, skip: number, isHorizontal?: boolean) {
  const verticalModifier = 1; //isHorizontal ? 1 : 2;
  const modifiedSkip = skip * verticalModifier;
  const calculatedValue = state.nodeCursor + modifiedSkip;

  const currentNodes = state.allCategories?.[state.categoryCursor]?.nodes;
  const maxNodeIndex = currentNodes?.length - 1;

  const maxCategoryIndex = state.allCategories.length;

  let targetValue;

  if (state.nodeCursor === null && skip > 0) {
    targetValue = 0;
  } else if (calculatedValue > maxNodeIndex) {
    if (state.categoryCursor + 1 <= maxCategoryIndex) {
      return moveCategoryCursor(state, 1);
    }
  } else if (calculatedValue < 0) {
    targetValue = null;
    return moveCategoryCursor(state, 0);
  } else if (typeof currentNodes?.[calculatedValue] !== 'object') {
    targetValue = calculatedValue + modifiedSkip;
  } else {
    targetValue = calculatedValue;
  }

  return {
    ...state,
    cursorContext: CursorContext.Node,
    nodeCursor: targetValue
  };
}

function toggleCategory(state: ICursorState) {
  const categoryStateCopy = [...state.allCategories];

  categoryStateCopy[state.categoryCursor].isCollapsed = !categoryStateCopy[state.categoryCursor].isCollapsed;

  return {
    ...state,
    allCategories: categoryStateCopy
  };
}

function allowNodeCreation(state: ICursorState) {
  if (state.categoryCursor === null || state.nodeCursor === null) return state;

  return {
    ...state,
    allowNodeCreation: true
  };
}

function enterCategoryContext(state: ICursorState): ICursorState {
  return {
    ...state,
    categoryCursor: 0,
    nodeCursor: null,
    cursorContext: CursorContext.Category,
    disableCollapseTransition: false
  };
}

function enterSearchContext(state: ICursorState): ICursorState {
  return {
    ...state,
    categoryCursor: null,
    nodeCursor: null,
    cursorContext: CursorContext.Search,
    disableCollapseTransition: true
  };
}

function highlightFirstNode(state: ICursorState): ICursorState {
  return {
    ...state,
    categoryCursor: 0,
    nodeCursor: 0
  };
}

function setAllCategoriesCollapsedState(state: ICursorState, isCollapsed: boolean): ICursorState {
  const categoryStateCopy = [...state.allCategories];

  categoryStateCopy.forEach((category) => (category.isCollapsed = isCollapsed));

  return {
    ...state,
    allCategories: categoryStateCopy
  };
}

function enableCollapseTransition(state: ICursorState): ICursorState {
  return {
    ...state,
    disableCollapseTransition: false
  };
}

function disableCollapseTransition(state: ICursorState): ICursorState {
  return {
    ...state,
    disableCollapseTransition: true
  };
}

export function cursorReducer(state: ICursorState, action: TSFixme) {
  const currentCategory = state.allCategories[state.categoryCursor];
  const isCurrentCategoryCollapsed = currentCategory ? currentCategory.isCollapsed : true;

  switch (action.type) {
    case CursorActionType.MoveCursor: {
      switch (state.cursorContext) {
        case CursorContext.Category:
          if (isCurrentCategoryCollapsed) {
            return moveCategoryCursor(state, action.skip);
          } else {
            if (action.skip > 0) {
              return moveNodeCursor(state, action.skip);
            } else {
              return moveCategoryCursor(state, action.skip);
            }
          }

        case CursorContext.Search:
          if (action.skip === -1) return state;

          if (state.nodeCursor !== null) {
            return moveNodeCursor(state, action.skip);
          }

          return enterCategoryContext(state);

        case CursorContext.Node:
          return moveNodeCursor(state, action.skip, action.isHorizontal);

        default:
          console.warn('No cursor context provided in move cursor');
          return state;
      }
    }

    case CursorActionType.HandleEnter:
      switch (state.cursorContext) {
        case CursorContext.Category:
          return toggleCategory(state);

        case CursorContext.Node:
        case CursorContext.Search:
          return allowNodeCreation(state);

        default:
          console.warn('No cursor context provided in handle enter');
          return state;
      }

    case CursorActionType.OpenAllCategories:
      return setAllCategoriesCollapsedState(state, false);

    case CursorActionType.CloseAllCategories:
      return setAllCategoriesCollapsedState(state, true);

    case CursorActionType.UpdateAllCurrentCategories: {
      const stateCopy = { ...state, allCategories: action.allCategories };

      if (typeof action.withCollapsedCategories === 'undefined') {
        return stateCopy;
      }

      return setAllCategoriesCollapsedState(state, action.withCollapsedCategories);
    }

    case CursorActionType.HighlightFirstNode:
      return highlightFirstNode(state);

    case CursorActionType.HandleSearchUpdate: {
      const stateCopy = { ...action.state };

      stateCopy.disableCollapseTransition = true;

      const stateCopyWithOpenCategories = setAllCategoriesCollapsedState(stateCopy, false);

      return highlightFirstNode(stateCopyWithOpenCategories);
    }

    case CursorActionType.AfterNodeCreation:
      return {
        ...state,
        allowNodeCreation: false
      };

    case CursorActionType.EnterSearchContext:
      return enterSearchContext(state);

    case CursorActionType.DisableCollapseTransition:
      return disableCollapseTransition(state);

    case CursorActionType.EnableCollapseTransition:
      return enableCollapseTransition(state);

    default:
      console.warn(`No action with type ${action.type} exists`);
      return state;
  }
}

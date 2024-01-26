import useCallAfterNextRender from '@noodl-hooks/useCallAfterNextRender';
import useFetch from '@noodl-hooks/useFetch';
import useOnMount from '@noodl-hooks/useOnMount';
import { ipcRenderer } from 'electron';
import _ from 'underscore';
import { Dispatch, RefObject, SetStateAction, useEffect, useReducer, useRef, useState } from 'react';

import { INodeType } from '@noodl-types/nodeTypes';
import { KeyCode } from '@noodl-constants/KeyCode';
import { DocsParser } from '@noodl-utils/docs-parser';
import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';

import { INodeIndex, INodeIndexCategory } from '../../utils/createnodeindex';
import { CursorActionType, CursorContext, cursorReducer, ICursorState } from './NodePicker.reducer';

/**
 * useSearchBar
 *
 * Features all search functionality.
 * Creates a copy of the allowed NodeIndex, mutates it
 * and sets it as the renderable items.
 */

function matchResults(items: INodeIndex, searchTerm: string): INodeIndex {
  return {
    coreNodes: filterItems(items.coreNodes, searchTerm),
    customNodes: filterItems(items.customNodes, searchTerm)
  };
}

// sorry for this huge filtering function.
function filterItems(categories: INodeIndexCategory[], searchTerm: string) {
  const result = categories
    .filter((category) => {
      // remove all categories without result items
      let containsChildren = false;

      category.subCategories.forEach((subCategory) => {
        const isInSearch = isItemInSearch(subCategory.items, searchTerm);

        if (!isInSearch) return false;

        containsChildren = true;

        return true;
      });

      return containsChildren;
    })
    .map((category) => ({
      ...category,
      subCategories: category?.subCategories
        ?.filter((subCategory) => {
          // remove all subCtegories without results
          const isInSearch = isItemInSearch(subCategory.items, searchTerm);

          if (!isInSearch) return false;

          return true;
        })
        .map((subCategory) => {
          return {
            ...subCategory,
            items: subCategory.items
              .map((type: INodeType) => {
                // add indices for how relevant the
                // items are compared to the search term
                const matchIndex = getMatchIndex(type, searchTerm);
                return { type, matchIndex };
              })
              // remove all items that are irrelevant
              .filter((type) => type.matchIndex !== -1)
              // sort all items based on how relevant they are
              .sort((a, b) => {
                return sortResultsWithMatchIndex(a, b);
              })
          };
        })
        .sort((a, b) => {
          // sort all subCategories
          const firstItemA = a?.items?.[0];
          const firstItemB = b?.items?.[0];

          return sortResultsWithMatchIndex(firstItemA, firstItemB);
        })
    }))
    .sort((a, b) => {
      // sort all categories based on their first items matchIndex
      const firstItemA = a.subCategories?.[0]?.items?.[0];
      const firstItemB = b.subCategories?.[0]?.items?.[0];
      return sortResultsWithMatchIndex(firstItemA, firstItemB);
    })
    .map((category) => ({
      // remove matchIndex from items
      ...category,
      subCategories: category.subCategories.map((subCategory) => ({
        ...subCategory,
        items: subCategory.items.map((item) => item.type)
      }))
    }));

  return result;
}

function sortResultsWithMatchIndex(a, b) {
  const match = a.matchIndex - b.matchIndex;
  if (match !== 0) return match;

  return a.type.name.length - b.type.name.length;
}

function getMatchIndex(item: INodeType, searchTerm: string) {
  if (item.searchTags && item.searchTags.some((x: string) => x.toLowerCase().indexOf(searchTerm) !== -1)) {
    return true;
  }

  const name = item.displayName || item.displayNodeName || item.name;
  return name.toLowerCase().indexOf(searchTerm);
}

function isItemInSearch(items: INodeType[], searchTerm: string) {
  const searchTermLowerCase = searchTerm.toLowerCase();

  let isInSearch = false;

  items.forEach((type: INodeType) => {
    const matchIndex = getMatchIndex(type, searchTermLowerCase);

    if (matchIndex !== -1) {
      isInSearch = true;
    }
  });

  return isInSearch;
}

export function useSearchBar(
  searchInput: RefObject<HTMLInputElement>,
  setRenderedNodes: Dispatch<SetStateAction<INodeIndex>>,
  items: INodeIndex,
  cursorContext: CursorContext,
  openAllCategories: () => void,
  closeAllCategories: () => void,
  handleSearchUpdate: () => void
) {
  useOnMount(() => {
    requestAnimationFrame(() => {
      // in rAF to avoid flushDiscreteUpdates error
      searchInput?.current?.focus();
    });
  });

  useEffect(() => {
    function onWindowFocus() {
      requestAnimationFrame(() => {
        searchInput?.current?.focus();
      });
    }

    ipcRenderer.on('window-focused', onWindowFocus);
    return function () {
      ipcRenderer.off('window-focused', onWindowFocus);
    };
  }, []);

  if (cursorContext === CursorContext.Search) {
    requestAnimationFrame(() => {
      // in rAF to avoid flushDiscreteUpdates error
      searchInput?.current?.focus();
    });
  } else {
    requestAnimationFrame(() => {
      // in rAF to avoid flushDiscreteUpdates error
      searchInput?.current?.blur();
    });
  }

  const [searchTerm, setSearchTerm] = useState('');

  const doAfterNextRender = useCallAfterNextRender();

  useEffect(() => {
    doAfterNextRender(() => {
      if (searchTerm) {
        setRenderedNodes(() => matchResults(items, searchTerm.toLowerCase()));
        handleSearchUpdate();
        openAllCategories();
      } else {
        setRenderedNodes(items);
        closeAllCategories();
      }
    });
  }, [searchTerm]);

  return setSearchTerm;
}

/**
 * useKeybardCursor
 *
 * handles keyboard interactions
 */
interface UseKeyboardCursorReturnProps {
  cursorState: ICursorState;
  openAllCategories: () => void;
  closeAllCategories: () => void;
  handleSearchUpdate: () => void;
  updateAllCurrentCategories: () => void;
  focusSearch: () => void;
  enableCollapseTransition: () => void;
  disableCollapseTransition: () => void;
}

export function useKeyboardCursor(renderedNodes: INodeIndex): UseKeyboardCursorReturnProps {
  const coreCategories = renderedNodes.coreNodes.map((category) => category.name);
  const customCategories = renderedNodes.customNodes.map((category) => category.name);

  function getAllNodesInCategory(categoryName: string): any {
    const coreNodes = renderedNodes.coreNodes.find((category) => category.name === categoryName);
    const customNodes = renderedNodes.customNodes.find((catgegory) => catgegory.name === categoryName);

    let sourceNodes: INodeIndexCategory;
    let items: TSFixme = [];

    if (coreNodes) sourceNodes = coreNodes;
    if (customNodes) sourceNodes = customNodes;

    sourceNodes.subCategories.forEach((subCategory) => {
      if (items.length > 0 && items.length % 2 !== 0) {
        items.push('spacer');
      }

      items = [...items, ...subCategory.items];
    });

    return items;
  }

  function parseAllCurrentCategories() {
    return [...coreCategories, ...customCategories].map((categoryName) => ({
      name: categoryName,
      isCollapsed: true,
      nodes: getAllNodesInCategory(categoryName)
    }));
  }

  const initialCursorState: ICursorState = {
    categoryCursor: null,
    nodeCursor: null,
    cursorContext: CursorContext.Search,
    allowNodeCreation: false,
    disableCollapseTransition: true,
    allCategories: parseAllCurrentCategories()
  };

  const [cursorState, dispatch] = useReducer(cursorReducer, initialCursorState);

  function handleEnter() {
    dispatch({ type: CursorActionType.HandleEnter });
  }

  function moveCursor(skip: number, isHorizontal?: boolean) {
    dispatch({ type: CursorActionType.MoveCursor, skip, isHorizontal });
  }

  function openAllCategories() {
    dispatch({ type: CursorActionType.OpenAllCategories });
  }

  function closeAllCategories() {
    dispatch({ type: CursorActionType.CloseAllCategories });
  }

  function updateAllCurrentCategories(withCollapsedCategories?: boolean) {
    dispatch({
      type: CursorActionType.UpdateAllCurrentCategories,
      allCategories: parseAllCurrentCategories(),
      withCollapsedCategories
    });
  }

  function focusSearch() {
    dispatch({ type: CursorActionType.EnterSearchContext });
  }

  function handleSearchUpdate() {
    dispatch({
      type: CursorActionType.HandleSearchUpdate,
      state: initialCursorState
    });
  }

  function enableCollapseTransition() {
    dispatch({
      type: CursorActionType.EnableCollapseTransition
    });
  }

  function disableCollapseTransition() {
    dispatch({
      type: CursorActionType.DisableCollapseTransition
    });
  }

  useEffect(() => {
    updateAllCurrentCategories();

    const handleKeyDown = (event) => {
      switch (event.keyCode) {
        case KeyCode.Down:
          moveCursor(1);
          break;

        case KeyCode.Up:
          moveCursor(-1);
          break;

        // When we had the nodes in 2 columns this was necessary.
        // It is no longer, but keeping it here if we would
        // ever need to bring it back.
        //
        // Also check verticalModifier in moveNodeCursor()
        //
        // case KeyCode.Left:
        //   moveCursor(-1, true);
        //   break;
        //
        // case KeyCode.Right:
        //   moveCursor(1, true);
        //   break;

        case KeyCode.Enter:
          handleEnter();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [renderedNodes]);

  return {
    cursorState,
    openAllCategories,
    closeAllCategories,
    updateAllCurrentCategories,
    handleSearchUpdate,
    focusSearch,
    enableCollapseTransition,
    disableCollapseTransition
  };
}

/**
 * useDocs
 * Downloading docs, passing them through the DocsParser
 * and setting the result to a renderable state
 */
export function useDocs() {
  const emptyCurrentDocsValue = { content: '', url: '' };
  const [currentDocs, setCurrentDocs] = useState(emptyCurrentDocsValue);

  const timer = useRef(null);

  function getDocs(type: INodeType) {
    timer.current = setTimeout(() => {
      const docs = type.docs;

      if (!docs) {
        clearDocs();
        return;
      }

      let docsUrl = docs;

      // Update no version tag with version tag (and potentially switch to local docs)
      docsUrl = docsUrl.replace('https://docs.noodl.net', getDocsEndpoint());
      docsUrl = docsUrl.replace('#/', '');
      const fullDocsUrl = docsUrl.replace('README', '').replace('.md', '');

      if (!docsUrl.endsWith('.md')) docsUrl = docsUrl += '.md';

      const dp = new DocsParser();
      dp.fetchPage(docsUrl, (el: HTMLElement) => {
        setCurrentDocs({
          content: el?.outerHTML,
          url: el?.outerHTML ? fullDocsUrl : ''
        });
      });
    }, 300);
  }

  function cancelGetDocs() {
    clearTimeout(timer.current);
  }

  function clearDocs() {
    setCurrentDocs(emptyCurrentDocsValue);
  }

  return {
    getDocs,
    cancelGetDocs,
    clearDocs,
    currentDocs
  };
}

export function useGetDefaultDocs() {
  const endpoint = getDocsEndpoint();
  const fullEndpoint = endpoint + '/nodepickerdefaults/index.json' + '?' + new Date().getTime();
  const [items, setItems] = useState([]);

  const res = useFetch(fullEndpoint);

  useEffect(() => {
    if (res.response?.length) {
      setItems(
        res.response.map((t) => ({
          ...t,
          linkUrl: endpoint + '/' + t.linkUrl,
          imageUrl: t.imageUrl ? endpoint + '/nodepickerdefaults/' + t.imageUrl : undefined
        }))
      );
    }
  }, [res.response]);

  return items;
}

export type SliderNews = {
  supertitle: string;
  title: string;
  text: string;
  action:
    | {
        kind: 'link';
        linkUrl: string;
        label: string;
      }
    | {
        kind: 'action';
        action: string;
        label: string;
      };
  imageUrl: string;
};

const NODE_PICKER_NEWS_STATE_STORAGE_KEY = 'nodepicker_news_state';

/**
 * HACK: Clear the current node picker news state
 *       so the next time it will always show the first slide.
 */
export function NodePickerClearNews() {
  localStorage.removeItem(NODE_PICKER_NEWS_STATE_STORAGE_KEY);
}

function getActiveIndex(items: SliderNews[]) {
  let activeIndex = 0;

  const storedData = localStorage.getItem(NODE_PICKER_NEWS_STATE_STORAGE_KEY);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    activeIndex = parsedData.activeIndex + 1;
    if (activeIndex >= items.length) {
      activeIndex = 0;
    }
  }

  localStorage.setItem(
    NODE_PICKER_NEWS_STATE_STORAGE_KEY,
    JSON.stringify({
      activeIndex
    })
  );

  return activeIndex;
}

export function useGetSliderNews() {
  const endpoint = getDocsEndpoint();
  const fullEndpoint = endpoint + '/nodepickerdefaults/news.json' + '?' + new Date().getTime();

  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const res = useFetch(fullEndpoint);

  useEffect(() => {
    function parseAction(action: Record<string, unknown>): SliderNews['action'] {
      switch (action.kind) {
        case 'link':
          return {
            kind: 'link',
            linkUrl: String(action.linkUrl),
            label: String(action.label)
          };
        case 'action':
          return {
            kind: 'action',
            action: String(action.action),
            label: String(action.label)
          };
      }
    }

    if (res.response && res.response.items.length) {
      const items = res.response.items.map((x: Record<string, unknown>) => ({
        supertitle: x.supertitle,
        title: x.title,
        text: x.text,
        action: typeof x.action === 'object' ? parseAction(x.action as Record<string, unknown>) : null,
        imageUrl: x.imageUrl ? endpoint + '/nodepickerdefaults/' + x.imageUrl : undefined
      }));

      setItems(items);
      setActiveIndex(getActiveIndex(items));
    }
  }, [res.response]);

  return { items, activeIndex };
}

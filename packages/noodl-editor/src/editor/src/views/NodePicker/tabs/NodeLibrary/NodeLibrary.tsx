import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import { platform } from '@noodl/platform';

import { NodeGraphModel, NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';
import { SidebarModel } from '@noodl-models/sidebar';
import { createNodeIndex } from '@noodl-utils/createnodeindex';
import { tracker } from '@noodl-utils/tracker';

import { HtmlRenderer } from '@noodl-core-ui/components/common/HtmlRenderer';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { SearchInput } from '@noodl-core-ui/components/inputs/SearchInput';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Carousel } from '@noodl-core-ui/components/layout/Carousel';
import { CarouselIndicatorDot } from '@noodl-core-ui/components/layout/CarouselIndicatorDot';
import { Center } from '@noodl-core-ui/components/layout/Center';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize, TitleVariant } from '@noodl-core-ui/components/typography/Title';

import NodePickerCategory from '../../components/NodePickerCategory';
import NodePickerNodeGroup from '../../components/NodePickerNodeGroup';
import NodePickerOtherItem from '../../components/NodePickerOtherItem';
import NodePickerSection from '../../components/NodePickerSection';
import NodePickerSubCategory from '../../components/NodePickerSubCategory';
import { useNodePickerContext } from '../../NodePicker.context';
import { SliderNews, useDocs, useGetSliderNews, useKeyboardCursor, useSearchBar } from '../../NodePicker.hooks';
import {
  getIsCategoryCollapsed,
  getIsCategoryCursorMatchingCategory,
  getIsNodeCursorMatchingNode
} from '../../NodePicker.selectors';
import { createNodeFunction, createNewComment } from '../../NodePicker.utils';
import css from './NodeLibrary.module.scss';

export interface NodeLibraryProps {
  model: NodeGraphModel;
  parentModel: NodeGraphNode;
  pos: TSFixme;
  attachToRoot: boolean;
  runtimeType: RuntimeType;
}

export function NodeLibrary({ model, parentModel, pos, attachToRoot, runtimeType }: NodeLibraryProps) {
  // const defaultDocsCards = useGetDefaultDocs();
  const news = useGetSliderNews();

  const { getDocs, cancelGetDocs, currentDocs } = useDocs();

  const [items] = useState(createNodeIndex(model, parentModel, runtimeType));

  const [renderedNodes, setRenderedNodes] = useState(items);

  const {
    cursorState,
    openAllCategories,
    closeAllCategories,
    handleSearchUpdate,
    focusSearch,
    enableCollapseTransition,
    disableCollapseTransition
  } = useKeyboardCursor(renderedNodes);

  const createNode = createNodeFunction(model, parentModel, pos, attachToRoot);

  const searchInput = useRef<HTMLInputElement>(null);

  const setSearchTerm = useSearchBar(
    searchInput,
    setRenderedNodes,
    items,
    cursorState.cursorContext,
    openAllCategories,
    closeAllCategories,
    handleSearchUpdate
  );

  //TODO: make this fit better into the NodePicker structure
  let showCommentAction = true;
  if (searchInput.current && searchInput.current.value.length > 0) {
    showCommentAction = 'comments'.includes(searchInput.current.value.toLowerCase());
  }

  return (
    <div className={css['Root']}>
      <div className={css['SearchContainer']}>
        <SearchInput
          placeholder="Search for nodes and components"
          inputRef={searchInput}
          onChange={setSearchTerm}
          onClick={() => focusSearch()}
        />
      </div>
      <div className={css['Content']}>
        <nav
          className={classNames([css['Navbar'], css['ScrollableContainer']])}
          onMouseOver={enableCollapseTransition}
          onMouseLeave={disableCollapseTransition}
        >
          <div className={css['NavbarInner']}>
            <div>
              <NodePickerSection key="Core nodes" title="Core nodes">
                {renderedNodes.coreNodes?.map((category) => (
                  <NodePickerCategory
                    key={category.name}
                    title={category.name}
                    description={category.description}
                    disableTransition={cursorState.disableCollapseTransition}
                    isCollapsed={getIsCategoryCollapsed(cursorState, category.name)}
                    type={category.type}
                    isKeyboardCursored={getIsCategoryCursorMatchingCategory(cursorState, category.name)}
                  >
                    {category?.subCategories?.map(
                      (subCategory) =>
                        !!subCategory?.items?.length && (
                          <NodePickerSubCategory key={subCategory.name} title={subCategory.name}>
                            <NodePickerNodeGroup
                              items={subCategory.items}
                              parentCategoryName={category.name}
                              cursorState={cursorState}
                              nodeCursorMatcher={getIsNodeCursorMatchingNode}
                              doCreateSelectedNode={cursorState?.allowNodeCreation}
                              onGetDocs={getDocs}
                              onMouseLeaveNode={cancelGetDocs}
                              onCreateNode={createNode}
                            />
                          </NodePickerSubCategory>
                        )
                    )}
                  </NodePickerCategory>
                ))}
              </NodePickerSection>

              {renderedNodes.customNodes.length ? (
                <NodePickerSection key="Custom nodes" title="Custom nodes">
                  {renderedNodes.customNodes?.map((category) => (
                    <NodePickerCategory
                      key={category.name}
                      title={category.name}
                      description={category.description}
                      disableTransition={
                        cursorState.disableCollapseTransition ||
                        //disable the collapse transition if a category has more than 50 items. This addresses
                        //a performance issue when the "Project Components" category has a lot of components since the
                        //Collapsible component will render _all_ of them to be able to perform a transition
                        category.subCategories?.reduce((prev, x) => prev + x.items.length, 0) > 50
                      }
                      isCollapsed={getIsCategoryCollapsed(cursorState, category.name)}
                      isKeyboardCursored={getIsCategoryCursorMatchingCategory(cursorState, category.name)}
                    >
                      {category?.subCategories?.map(
                        (subCategory) =>
                          !!subCategory?.items?.length && (
                            <NodePickerSubCategory key={subCategory.name} title={subCategory.name}>
                              <NodePickerNodeGroup
                                items={subCategory.items}
                                parentCategoryName={category.name}
                                cursorState={cursorState}
                                nodeCursorMatcher={getIsNodeCursorMatchingNode}
                                doCreateSelectedNode={cursorState?.allowNodeCreation}
                                onGetDocs={getDocs}
                                onMouseLeaveNode={cancelGetDocs}
                                onCreateNode={createNode}
                              />
                            </NodePickerSubCategory>
                          )
                      )}
                    </NodePickerCategory>
                  ))}
                </NodePickerSection>
              ) : null}
            </div>

            {showCommentAction ? (
              <NodePickerSection key="Other" title="Other">
                <NodePickerOtherItem
                  title="Comment"
                  description="Place a comment in the node graph"
                  onClick={(e) => {
                    createNewComment(model, pos);
                    e.stopPropagation();
                  }}
                  icon={<img src="../assets/icons/comment.svg" />}
                />
              </NodePickerSection>
            ) : null}
          </div>
        </nav>

        <article className={css['Docs']}>
          {currentDocs.url ? (
            <div className={css['FullDocsButton']}>
              <PrimaryButton
                size={PrimaryButtonSize.Small}
                variant={PrimaryButtonVariant.MutedOnLowBg}
                label="Open full docs"
                onClick={() => {
                  tracker.track('Open Node Docs Clicked', { url: currentDocs.url });
                  platform.openExternal(currentDocs.url);
                }}
              />
            </div>
          ) : (
            <Carousel
              items={news.items.map((x) => ({
                slot: <NodePickerSlider {...x} />
              }))}
              indicator={CarouselIndicatorDot}
              activeIndex={news.activeIndex}
            />
          )}
          <HtmlRenderer html={currentDocs.content} />
        </article>
      </div>
    </div>
  );
}

function NodePickerSlider({ supertitle, title, text, action, imageUrl }: SliderNews) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <Box>
        <Title isCentered variant={TitleVariant.Default}>
          {supertitle}
        </Title>
        <Title isCentered variant={TitleVariant.Highlighted} size={TitleSize.Large}>
          {title}
        </Title>
        <Box hasXSpacing hasYSpacing>
          <Text isCentered>{text}</Text>
        </Box>
        {action && <NodePickerSliderAction {...action} />}
      </Box>
      <img style={{ pointerEvents: 'none', userSelect: 'none' }} draggable="false" srcSet={imageUrl} />
    </div>
  );
}

function NodePickerSliderAction(action: SliderNews['action']) {
  const context = useNodePickerContext();

  switch (action.kind) {
    default:
    case 'link':
      return (
        <Center>
          <PrimaryButton
            label={action.label}
            size={PrimaryButtonSize.Small}
            variant={PrimaryButtonVariant.Ghost}
            hasBottomSpacing
            onClick={() => {
              platform.openExternal(action.linkUrl);
            }}
          />
        </Center>
      );

    case 'action':
      return (
        <Center>
          <PrimaryButton
            label={action.label}
            size={PrimaryButtonSize.Small}
            variant={PrimaryButtonVariant.Ghost}
            hasBottomSpacing
            onClick={() => {
              const command = action.action.split(':');
              switch (command[0]) {
                case 'panel': {
                  SidebarModel.instance.switch(command[1]);
                  break;
                }

                case 'tab': {
                  context.setActiveTab(command[1]);
                  break;
                }
              }
            }}
          />
        </Center>
      );
  }
}

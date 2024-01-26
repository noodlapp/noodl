import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { useFocusRefOnPanelActive } from '@noodl-hooks/useFocusRefOnPanelActive';
import { useNodeLibraryLoaded } from '@noodl-hooks/useNodeLibraryLoaded';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { INodeColorScheme } from '@noodl-types/nodeTypes';
import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { NodeLibrary, NodeLibraryNodeType } from '@noodl-models/nodelibrary';
import { BasicNodeType } from '@noodl-models/nodelibrary/BasicNodeType';
import { ProjectModel } from '@noodl-models/projectmodel';

import { EditorNode } from '@noodl-core-ui/components/common/EditorNode';
import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { Checkbox, CheckboxVariant } from '@noodl-core-ui/components/inputs/Checkbox';
import { IconButton, IconButtonState, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { SearchInput } from '@noodl-core-ui/components/inputs/SearchInput';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import { ListItem } from '@noodl-core-ui/components/layout/ListItem';
import { ScrollArea } from '@noodl-core-ui/components/layout/ScrollArea';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { ExperimentalFlag } from '@noodl-core-ui/components/sidebar/ExperimentalFlag';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Label } from '@noodl-core-ui/components/typography/Label';

import { NodeReferencesPanel_ID } from '.';
import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';

type ResultItem = {
  type: NodeLibraryNodeType;
  displayName: string;
  referenaces: {
    displayName: string;
    node?: NodeGraphNode;
    component: ComponentModel;
  }[];
};

function useNodeReferences() {
  const [group] = useState({});
  const [result, setResult] = useState<ResultItem[]>([]);

  useEffect(() => {
    function updateIndex() {
      const types: { [key: string]: ResultItem['type'] } = {};
      const references = new Map<string, ResultItem['referenaces']>();

      function handleComponent(component: ComponentModel) {
        component.forEachNode((node: NodeGraphNode) => {
          const name = node.type.name;

          // Add the reference
          references.set(name, [
            ...(references.get(name) || []),
            {
              displayName: component.displayName || component.name,
              node,
              component
            }
          ]);

          // Repeater
          if (name === 'For Each' && node.parameters.template) {
            const templateComponent = ProjectModel.instance.getComponentWithName(node.parameters.template);

            if (templateComponent) {
              references.set(templateComponent.fullName, [
                ...(references.get(templateComponent.fullName) || []),
                {
                  displayName: component.displayName || component.name,
                  node,
                  component
                }
              ]);

              handleComponent(templateComponent);
            }
          }

          // Add some metadata for this node if we dont have it yet.
          if (!types[name]) {
            types[name] = node.type;
          }
        });
      }

      // Loop all the nodes in the project
      ProjectModel.instance.forEachComponent(handleComponent);

      // Combine the result to look a little better.
      const results: ResultItem[] = Array.from(references.keys())
        .map((key) => ({
          type: types[key],
          displayName: types[key]?.displayName || key,
          referenaces: references.get(key)
        }))
        .sort((a, b) => b.referenaces.length - a.referenaces.length);

      setResult(results);
    }

    updateIndex();

    EventDispatcher.instance.on(
      [
        'Model.nodeAdded',
        'Model.nodeRemoved',
        'Model.componentAdded',
        'Model.componentRemoved',
        'Model.componentRenamed'
      ],
      updateIndex,
      group
    );

    return function () {
      EventDispatcher.instance.off(group);
    };
  }, []);

  return [result];
}

export function NodeReferencesPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [includeCoreNodes, setIncludeCoreNodes] = useState(false);
  const inputRef = useRef(null);
  const [result] = useNodeReferences();
  const nodeLibraryLoaded = useNodeLibraryLoaded();

  useFocusRefOnPanelActive(inputRef, NodeReferencesPanel_ID);

  function searchFilter(x: ResultItem) {
    if (x.displayName.toLowerCase().includes(searchTerm)) {
      return true;
    }

    if (x.type instanceof BasicNodeType) {
      if (x.type.displayName.toLowerCase().includes(searchTerm)) return;
    }

    return false;
  }

  let filteredResult = result.filter(searchFilter);
  if (!includeCoreNodes) {
    filteredResult = filteredResult.filter((x) => x.displayName.startsWith('/'));
  }

  return (
    <BasePanel title="Node References" isFill>
      <ExperimentalFlag />
      <Section variant={SectionVariant.PanelShy} hasVisibleOverflow hasGutter>
        <SearchInput
          placeholder="Search..."
          onChange={(text) => setSearchTerm(text.toLowerCase())}
          UNSAFE_style={{ height: 34 }}
          value={searchTerm}
          inputRef={inputRef}
        />
        <Box hasTopSpacing>
          <Checkbox
            isChecked={includeCoreNodes}
            label="Include Core Nodes"
            variant={CheckboxVariant.Sidebar}
            onChange={(event) => {
              setIncludeCoreNodes(!!event.target.checked);
            }}
          />
        </Box>
      </Section>
      {nodeLibraryLoaded && (
        <ScrollArea>
          <Box hasYSpacing UNSAFE_style={{ width: '100%' }}>
            {filteredResult.map((entry) => (
              <Item key={entry.displayName} entry={entry} />
            ))}
          </Box>
        </ScrollArea>
      )}
    </BasePanel>
  );
}

interface ItemProps {
  entry: ResultItem;
}

function Item({ entry }: ItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const colors: INodeColorScheme = useMemo(
    () =>
      entry.type
        ? NodeLibrary.instance.colorSchemeForNodeType(entry.type)
        : {
            base: '#4C4F59',
            baseHighlighted: '#62656e',
            header: '#373B45',
            headerHighlighted: '#4c4f59',
            outline: '#373B45',
            outlineHighlighted: '#b58900',
            text: '#d3d4d6'
          },
    [entry]
  );

  return (
    <Box hasXSpacing hasBottomSpacing={3} UNSAFE_style={{ cursor: 'pointer' }}>
      <div
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      >
        <div style={{ height: 36 }}>
          {entry.type ? (
            /* @ts-expect-error */
            <EditorNode item={entry.type} colors={colors} />
          ) : (
            /* @ts-expect-error */
            <EditorNode item={{ name: entry.displayName }} colors={colors} />
          )}
        </div>
        <Box hasXSpacing={2} UNSAFE_style={{ backgroundColor: colors.header }}>
          <HStack UNSAFE_style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>{entry.referenaces.length} references</Label>
            <IconButton
              variant={IconButtonVariant.Transparent}
              icon={IconName.CaretDown}
              size={IconSize.Tiny}
              state={isOpen ? IconButtonState.Rotated : null}
            />
          </HStack>
        </Box>
      </div>
      <Collapsible isCollapsed={!isOpen}>
        {entry.referenaces.map((referenace, index) => (
          <ItemReference key={index} entry={entry} referenace={referenace} colors={colors} />
        ))}
      </Collapsible>
    </Box>
  );
}

interface ItemReferenceProps {
  entry: ResultItem;
  referenace: ResultItem['referenaces'][0];
  colors: INodeColorScheme;
}

function ItemReference({ entry, referenace, colors }: ItemReferenceProps) {
  const [hover, setHover] = useState(false);

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <ListItem
        text={referenace.displayName}
        UNSAFE_style={{ backgroundColor: hover ? colors.baseHighlighted : colors.base }}
        onClick={() => {
          if (!referenace.node) return;
          NodeGraphContextTmp.nodeGraph.switchToComponent(referenace.component, {
            node: referenace.node,
            pushHistory: true
          });
        }}
      />
    </div>
  );
}

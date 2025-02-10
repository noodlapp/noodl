import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { type NodeReference, useNodeReferencesContext } from '@noodl-contexts/NodeReferencesContext';
import { useFocusRefOnPanelActive } from '@noodl-hooks/useFocusRefOnPanelActive';
import { useNodeLibraryLoaded } from '@noodl-hooks/useNodeLibraryLoaded';
import React, { useMemo, useRef, useState } from 'react';

import { INodeColorScheme } from '@noodl-types/nodeTypes';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import { BasicNodeType } from '@noodl-models/nodelibrary/BasicNodeType';

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

export function NodeReferencesPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [includeCoreNodes, setIncludeCoreNodes] = useState(false);
  const inputRef = useRef(null);
  const { nodeReferences } = useNodeReferencesContext();
  const nodeLibraryLoaded = useNodeLibraryLoaded();

  useFocusRefOnPanelActive(inputRef, NodeReferencesPanel_ID);

  function searchFilter(x: NodeReference) {
    if (x.displayName.toLowerCase().includes(searchTerm)) {
      return true;
    }

    if (x.type instanceof BasicNodeType) {
      if (x.type.displayName.toLowerCase().includes(searchTerm)) return;
    }

    return false;
  }

  let filteredResult = nodeReferences.filter(searchFilter);
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
  entry: NodeReference;
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
  entry: NodeReference;
  referenace: NodeReference['referenaces'][0];
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

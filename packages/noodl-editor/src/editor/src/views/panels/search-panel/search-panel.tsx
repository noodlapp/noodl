import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { useDebounceState } from '@noodl-hooks/useDebounceState';
import { useOnPanelActive } from '@noodl-hooks/useFocusRefOnPanelActive';
import { useSidePanelKeyboardCommands } from '@noodl-hooks/useKeyboardCommands';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { KeyCode, KeyMod } from '@noodl-utils/keyboard/KeyCode';
import { performSearch } from '@noodl-utils/universal-search';

import { SearchInput } from '@noodl-core-ui/components/inputs/SearchInput';
import { Container } from '@noodl-core-ui/components/layout/Container';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';

import css from './search-panel.module.scss';

export function SearchPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // TODO: Not same context
  // const { lastActiveComponentId, switchToComponent } = useNodeGraphContext();

  useOnPanelActive(() => {
    inputRef.current.focus();
    inputRef.current.select();
  }, 'search');

  useSidePanelKeyboardCommands(
    () => [
      {
        weight: 2,
        handler: () => {
          inputRef.current.focus();
          inputRef.current.select();
        },
        keybinding: KeyMod.CtrlCmd | KeyCode.KEY_F
      }
    ],
    'search'
  );

  const debouncedSearchTerm = useDebounceState(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm.length === 0) {
      setSearchResults([]);
    } else {
      setSearchResults(performSearch(debouncedSearchTerm));
    }
  }, [debouncedSearchTerm]);

  function onSearchItemClicked(searchResult: SearchResultItem) {
    if (searchResult.type === 'Component') {
      NodeGraphContextTmp.switchToComponent(searchResult.componentTarget, {
        breadcrumbs: false,
        pushHistory: true
      });
    } else {
      NodeGraphContextTmp.switchToComponent(searchResult.componentTarget, {
        breadcrumbs: false,
        node: searchResult.nodeTarget,
        pushHistory: true
      });
    }
  }

  return (
    <BasePanel title="Search">
      <div className={css.SearchInput}>
        <Section hasGutter>
          <SearchInput
            placeholder="Search nodes and properties"
            onChange={(text) => setSearchTerm(text)}
            UNSAFE_style={{ height: 34 }}
            value={searchTerm}
            inputRef={inputRef}
          />
        </Section>
      </div>

      <div className={css.SearchResults}>
        {searchResults.map((component) => (
          <SearchItem key={component.componentId} component={component} onSearchItemClicked={onSearchItemClicked} />
        ))}
        {searchResults.length === 0 && debouncedSearchTerm.length > 0 && (
          <Container hasXSpacing hasYSpacing>
            <Text>No results found</Text>
          </Container>
        )}
      </div>
    </BasePanel>
  );
}

type SearchResultItem = {
  componentTarget: ComponentModel;
  label: string;
  nodeTarget: NodeGraphNode;
  type: string;
  userLabel: string;
};

type SearchItemProps = {
  component: {
    componentName: string;
    componentId: string;
    results: SearchResultItem[];
  };
  onSearchItemClicked: (item: SearchResultItem) => void;
};

function SearchItem({ component, onSearchItemClicked }: SearchItemProps) {
  const resultCountText = `${component.results.length} result${component.results.length > 1 ? 's' : ''}`;
  let titleText = `${component.componentName} (${resultCountText})`;

  // We expect there to always be at least one result, to get the full component name.
  const isInCloudFunctions = component.results[0].componentTarget.name.startsWith('/#__cloud__/');
  if (isInCloudFunctions) {
    titleText += ' (Cloud Function)';
  }

  return (
    <Section title={titleText} variant={SectionVariant.Panel}>
      {component.results.map((result, index) => (
        <div
          className={classNames(
            css.SearchResultItem
            // lastActiveComponentId === result.componentTarget.id && css['is-active']
          )}
          key={index}
          onClick={() => onSearchItemClicked(result)}
        >
          <Label variant={TextType.Proud}>
            {result.userLabel ? result.type + ' - ' + result.userLabel : result.type}
          </Label>
          <Text>{result.label}</Text>
        </div>
      ))}
    </Section>
  );
}

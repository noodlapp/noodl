import algoliasearch from 'algoliasearch/lite';
import React, { useRef, useState } from 'react';
import { InstantSearch, Hits, Highlight, useSearchBox, Configure } from 'react-instantsearch-hooks-web';
import { platform } from '@noodl/platform';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { PrimaryButton, PrimaryButtonSize } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { SearchInput } from '@noodl-core-ui/components/inputs/SearchInput';
import Modal from '@noodl-core-ui/components/layout/Modal/Modal';
import { Portal } from '@noodl-core-ui/components/layout/Portal';
import { MenuDialog } from '@noodl-core-ui/components/popups/MenuDialog';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize } from '@noodl-core-ui/components/typography/Title';

import css from './HelpCenter.module.scss';

export function HelpCenter() {
  const rootRef = useRef();
  const [version] = useState(platform.getVersion().slice(0, 3));
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  const searchClient = algoliasearch('D29X2LNM4J', '7984d5feef068e1161527316bb9a1a4d');

  const portalRoot = document.querySelector('.help-center-layer');

  if (!portalRoot) return null;

  return (
    <Portal portalRoot={portalRoot}>
      <div className={css['Root']} ref={rootRef} onClick={() => setIsDialogVisible(true)}>
        <IconButton icon={IconName.QuestionFree} variant={IconButtonVariant.OpaqueOnHover} size={IconSize.Large} />
      </div>

      <Modal
        isVisible={isSearchModalVisible}
        onClose={() => {
          // small hack to prevent some memory leaks when closing modal
          // while InstantSearch is still running
          // not the best solution ever, but at least its quick and dirty
          setTimeout(() => setIsSearchModalVisible(false), 100);
        }}
        title="Search Help Center"
      >
        <InstantSearch searchClient={searchClient} indexName="docs_2-9">
          <SearchView />
        </InstantSearch>
      </Modal>

      <MenuDialog
        triggerRef={rootRef}
        isVisible={isDialogVisible}
        onClose={() => setIsDialogVisible(false)}
        items={[
          { label: 'Quick search docs', icon: IconName.Search, onClick: () => setIsSearchModalVisible(true) },
          'divider',
          {
            label: 'Getting started',
            onClick: () => platform.openExternal(`https://docs.noodl.net/${version}/docs/getting-started/overview`)
          },
          {
            label: 'YouTube videos',
            onClick: () => platform.openExternal('https://www.youtube.com/channel/UCLkJ8XYV1J1RqrZKY-o1YWg/playlists')
          },
          {
            label: 'Guides',
            onClick: () => platform.openExternal(`https://docs.noodl.net/${version}/docs/learn`)
          },
          'divider',
          {
            label: 'Ask the community (Discord)',
            onClick: () => platform.openExternal('https://discord.com/invite/23xU2hYrSJ')
          },
          { label: 'Support forum', onClick: () => platform.openExternal('https://forum.noodl.net/') },
          'divider',
          {
            label: 'Release notes',
            onClick: () => platform.openExternal(`https://docs.noodl.net/${version}/whats-new/`)
          },
          { label: 'Contact support', onClick: () => platform.openExternal('https://www.noodl.net/support') }
        ]}
      />
    </Portal>
  );
}

function SearchView(props) {
  const { query, refine } = useSearchBox(props);

  return (
    <>
      <SearchInput value={query} onChange={(value) => refine(value)} isAutoFocus />

      <Configure
        restrictSearchableAttributes={['content']}
        attributesToRetrieve={['content', 'hierarchy', 'url']}
        hitsPerPage={10}
      />
      {Boolean(query) && (
        <div className={css['ResultContainer']}>
          <Hits hitComponent={Hit} />
        </div>
      )}

      <div className={css['MessageContainer']}>
        <div className={css['Message']}>
          <Title hasBottomSpacing size={TitleSize.Large}>
            {query ? "Can't find what you're looking for?" : "Don't know what you're looking for?"}
          </Title>
          <Label>Browse our docs or reach out on Discord</Label>

          <div className={css['Buttons']}>
            <PrimaryButton label="Visit docs" href="https://docs.noodl.net" hasRightSpacing />
            <PrimaryButton label="Join our Discord" href="https://discord.com/invite/23xU2hYrSJ" />
          </div>
        </div>
      </div>
    </>
  );
}

type Hit = {
  url?: string;
  hierarchy?: {
    lvl0?: string;
    lvl1?: string;
    lvl2?: string;
    lvl3?: string;
    lvl4?: string;
    lvl5?: string;
    lvl6?: string;
  };
};

interface HitProps {
  hit: Hit;
  sendEvent: (eventType: string, hits: Hit | Hit[], eventName?: string) => void;
}

function Hit({ hit, sendEvent }: HitProps) {
  return (
    <div className={css['SearchHit']}>
      <div className={css['HitTitle']}>
        <div>
          <Label size={LabelSize.Small} variant={TextType.Secondary} hasBottomSpacing>
            {hit.hierarchy.lvl1}
          </Label>
          <Title size={TitleSize.Large} hasBottomSpacing>
            {hit.hierarchy.lvl2}
            {!hit.hierarchy.lvl2 && hit.hierarchy.lvl1}
          </Title>
        </div>

        <PrimaryButton
          label="Read full docs"
          size={PrimaryButtonSize.Small}
          onClick={() => {
            platform.openExternal(hit.url);
            sendEvent('clickedObjectIDsAfterSearch', hit, 'editor-docs-search');
          }}
        />
      </div>
      <Text>
        <Highlight attribute="content" hit={hit as any} />
      </Text>
    </div>
  );
}

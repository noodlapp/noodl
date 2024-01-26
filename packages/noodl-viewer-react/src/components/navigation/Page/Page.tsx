import React from 'react';

import type { TSFixme } from '../../../../typings/global';
import Layout from '../../../layout';
import { Noodl, Slot } from '../../../types';

type MetaTag = {
  isProperty: boolean;
  key: string;
  displayName: string;
  editorName?: string;
  group: string;
  type?: string;
  popout?: TSFixme;
};

const ogPopout = {
  group: 'seo-og',
  label: 'Open Graph',
  parentGroup: 'Experimental SEO'
};

const twitterPopout = {
  group: 'seo-twitter',
  label: 'Twitter',
  parentGroup: 'Experimental SEO'
};

export const META_TAGS: MetaTag[] = [
  {
    isProperty: true,
    key: 'description',
    displayName: 'Description',
    group: 'Experimental SEO'
  },
  {
    isProperty: true,
    key: 'robots',
    displayName: 'Robots',
    group: 'Experimental SEO'
  },
  {
    isProperty: true,
    key: 'og:title',
    displayName: 'Title',
    editorName: 'OG Title',
    group: 'General',
    popout: ogPopout
  },
  {
    isProperty: true,
    key: 'og:description',
    displayName: 'Description',
    editorName: 'OG Description',
    group: 'General',
    popout: ogPopout
  },
  {
    isProperty: true,
    key: 'og:url',
    displayName: 'Url',
    editorName: 'OG Url',
    group: 'General',
    popout: ogPopout
  },
  {
    isProperty: true,
    key: 'og:type',
    displayName: 'Type',
    editorName: 'OG Type',
    group: 'General',
    popout: ogPopout
  },
  {
    isProperty: true,
    key: 'og:image',
    displayName: 'Image',
    editorName: 'OG Image',
    group: 'Image',
    popout: ogPopout
  },
  {
    isProperty: true,
    key: 'og:image:width',
    displayName: 'Image Width',
    editorName: 'OG Image Width',
    group: 'Image',
    popout: ogPopout
  },
  {
    isProperty: true,
    key: 'og:image:height',
    displayName: 'Image Height',
    editorName: 'OG Image Height',
    group: 'Image',
    popout: ogPopout
  },
  {
    isProperty: false,
    key: 'twitter:card',
    displayName: 'Card',
    editorName: 'Twitter Card',
    group: 'General',
    popout: twitterPopout
  },
  {
    isProperty: false,
    key: 'twitter:title',
    displayName: 'Title',
    editorName: 'Twitter Title',
    group: 'General',
    popout: twitterPopout
  },
  {
    isProperty: false,
    key: 'twitter:description',
    displayName: 'Description',
    editorName: 'Twitter Description',
    group: 'General',
    popout: twitterPopout
  },
  {
    isProperty: false,
    key: 'twitter:image',
    displayName: 'Image',
    editorName: 'Twitter Image',
    group: 'General',
    popout: twitterPopout
  }
];

type MetaTagKey = typeof META_TAGS[number]['key'];

export interface PageProps extends Noodl.ReactProps {
  metatags?: Record<MetaTagKey, string>;

  children: Slot;
}

export function Page(props: PageProps) {
  const { style, children } = props;

  Layout.size(style, props);
  Layout.align(style, props);

  // Allow changing the metatags from inputs
  META_TAGS.forEach((item) => {
    const value = props.metatags && props.metatags[item.key];
    // @ts-expect-error Noodl is globally defined.
    Noodl.SEO.setMeta(item.key, value);
  });

  return (
    <div style={style} className={props.className}>
      {children}
    </div>
  );
}

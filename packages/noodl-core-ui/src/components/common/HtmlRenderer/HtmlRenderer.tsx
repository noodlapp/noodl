import React from 'react';

import css from './HtmlRenderer.module.scss';

export interface HtmlRendererProps {
  html: string;
}

export function HtmlRenderer({ html }: HtmlRendererProps) {
  return <div className={css['Root']} dangerouslySetInnerHTML={{ __html: html }} />;
}

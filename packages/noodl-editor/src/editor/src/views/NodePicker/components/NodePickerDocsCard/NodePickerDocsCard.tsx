import React from 'react';
import css from './NodePickerDocsCard.module.scss';

export interface NodePickerDocsCardProps {
  supertitle: string;
  title: string;
  linkUrl: string;
  imageUrl?: string;
}

export default function NodePickerDocsCard({ supertitle, title, linkUrl, imageUrl }: NodePickerDocsCardProps) {
  return (
    <a
      className={css['Root']}
      href={linkUrl}
      target="_blank"
      style={imageUrl && { backgroundImage: `url(${imageUrl})` }}
    >
      <span className={css['Supertitle']}>{supertitle}</span>
      <span className={css['Title']}>{title}</span>
    </a>
  );
}

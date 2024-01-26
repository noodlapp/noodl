import classNames from 'classnames';
import { Remarkable } from 'remarkable';
import React, { useMemo } from 'react';

import { UnsafeStyleProps } from '@noodl-core-ui/types/global';

import css from './Markdown.module.scss';

export interface MarkdownProps extends UnsafeStyleProps {
  content: string;
}

export function Markdown({ content, UNSAFE_className, UNSAFE_style }: MarkdownProps) {
  const __html = useMemo(() => {
    const md = new Remarkable({
      html: true,
      breaks: true
    });

    return md.render(content);
  }, [content]);

  return (
    <div
      className={classNames([css['Root'], UNSAFE_className])}
      style={UNSAFE_style}
      dangerouslySetInnerHTML={{ __html }}
    ></div>
  );
}

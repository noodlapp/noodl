import React from 'react';
import ReactDOM from 'react-dom';

import { NodeLibrary } from '@noodl-models/nodelibrary';

import css from '../ConnectionPopup.module.scss';

export function DocsPopup(props: TSFixme) {
  const enums = typeof props.type === 'object' && props.type.name === 'enum' ? props.type.enums : undefined;

  const typeDocs =
    '(' +
    NodeLibrary.nameForPortType(props.type) +
    (enums !== undefined ? ':' + enums.map((e) => e.label).join(',') : '') +
    ')';

  return ReactDOM.createPortal(
    <div className={css.docsPopup}>
      <div className={css.docsHeader}>
        <span>{props.name}</span>
        <span className={css.docsType}>{typeDocs}</span>
      </div>

      <div className={css.docsBody} dangerouslySetInnerHTML={{ __html: props.body }} />
    </div>,
    document.querySelector('.popup-small-docs')
  );
}

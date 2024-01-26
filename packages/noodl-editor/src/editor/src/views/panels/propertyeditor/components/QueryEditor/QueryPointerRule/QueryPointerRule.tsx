import React, { useRef } from 'react';

import { QueryEditPopup } from '../QueryEditPopup';
import { openPopup } from '../utils';

export interface QueryPointerRuleProps {
  query: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDelete: TSFixme;
}

export function QueryPointerRule(props: QueryPointerRuleProps) {
  const popupAnchor = useRef(null);

  function openEditPopup(e) {
    e.stopPropagation();
    openPopup({
      reactComponent: QueryEditPopup,
      props: {
        query: props.query,
        schema: props.schema
      },
      attachTo: popupAnchor.current,
      onChange: props.onChange,
      onDelete: props.onDelete
    });
  }

  const q = props.query;
  return (
    <div className="queryeditor-text-rule" onClick={openEditPopup} ref={popupAnchor}>
      <span className="queryeditor-span">
        where the property
        {q.property !== undefined ? (
          <span>
            <span className="queryeditor-span-strong">{q.property}</span>
            is pointing to a record with id that matches the input
            {q.input !== undefined ? (
              <span>
                <span className="queryeditor-span-strong">{'' + q.input}</span>
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </div>
  );
}

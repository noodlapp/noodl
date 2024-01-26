import React, { useRef } from 'react';

import { QueryEditPopup } from '../QueryEditPopup';
import { openPopup } from '../utils';

export interface QueryRuleProps {
  query: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDelete: TSFixme;
}

export function QueryRule(props: QueryRuleProps) {
  const popupAnchor = useRef(null);

  function openEditPopup(e) {
    e.stopPropagation();
    openPopup({
      reactComponent: QueryEditPopup,
      props: {
        query: props.query,
        schema: props.schema
      },
      onChange: props.onChange,
      onDelete: props.onDelete,
      attachTo: popupAnchor.current
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
            {q.operator !== undefined && q.operator !== 'exist' && q.operator !== 'not exist' ? (
              <span>
                {q.operator === 'contain' ? 'does' : 'is'}
                <span className="queryeditor-span-strong">{q.operator}</span>

                {q.value !== undefined && q.input === undefined ? (
                  <span>
                    the value
                    <span className="queryeditor-span-strong">{'' + q.value}</span>
                  </span>
                ) : null}

                {q.input !== undefined ? (
                  <span>
                    the input
                    <span className="queryeditor-span-strong">{'' + q.input}</span>
                  </span>
                ) : null}
              </span>
            ) : null}

            {q.operator !== undefined && (q.operator === 'exist' || q.operator === 'not exist') ? (
              <span>
                does
                <span className="queryeditor-span-strong">{q.operator}</span>
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </div>
  );
}

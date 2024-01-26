import React, { useRef } from 'react';

import { QueryEditPopup } from '../QueryEditPopup';
import { openPopup } from '../utils';

export interface QueryRelationRuleProps {
  query: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDelete: TSFixme;
}

export function QueryRelationRule(props: QueryRelationRuleProps) {
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
        that is related to another record with class
        {q.relatedTo !== undefined ? (
          <span>
            <span className="queryeditor-span-strong">{q.relatedTo}</span>
            via the relation property
            {q.relationProperty !== undefined ? (
              <span>
                <span className="queryeditor-span-strong">{q.relationProperty}</span>
                with id that matches the input
                {q.input !== undefined ? (
                  <span>
                    <span className="queryeditor-span-strong">{'' + q.input}</span>
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </div>
  );
}

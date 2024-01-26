import React, { useRef } from 'react';

import { QuerySortingRuleEditPopup } from '../QuerySortingRuleEditPopup';
import { openPopup } from '../utils';

export interface QuerySortingRuleProps {
  rule: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDelete: TSFixme;
}

export function QuerySortingRule(props: QuerySortingRuleProps) {
  const popupAnchor = useRef(null);

  function openEditPopup(e) {
    e.stopPropagation();
    openPopup({
      reactComponent: QuerySortingRuleEditPopup,
      props: {
        rule: props.rule,
        schema: props.schema
      },
      attachTo: popupAnchor.current,
      onChange: props.onChange,
      onDelete: props.onDelete
    });
  }

  const r = props.rule;
  return (
    <div className="queryeditor-text-rule" onClick={openEditPopup} ref={popupAnchor}>
      <span className="queryeditor-span">
        by the property
        {r.property !== undefined ? (
          <span>
            <span className="queryeditor-span-strong">{r.property}</span>
            {r.order !== undefined ? (
              <span>
                in
                <span className="queryeditor-span-strong">{r.order}</span>
                order
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </div>
  );
}

import React from 'react';

import { QueryRulePopup } from '../QueryRulePopup';
import { RuleDropdown } from '../RuleDropdown';

export interface QuerySortingRuleEditPopupProps {
  rule: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDelete: TSFixme;
}

export function QuerySortingRuleEditPopup(props: QuerySortingRuleEditPopupProps) {
  function onPropItemClicked(property) {
    props.rule.property = property;
    props.onChange && props.onChange();
  }

  function onOrderItemClicked(order) {
    props.rule.order = order;
    props.onChange && props.onChange();
  }

  const r = props.rule;
  const properties = Object.keys(props.schema.properties);

  return (
    <QueryRulePopup title="Edit sorting rule" onDeleteClicked={props.onDelete}>
      <RuleDropdown label="PROPERTY" dropdownItems={properties} value={r.property} onItemSelected={onPropItemClicked} />

      {r.property !== undefined ? (
        <RuleDropdown
          label="ORDER"
          dropdownItems={['ascending', 'descending']}
          value={r.order}
          onItemSelected={onOrderItemClicked}
        />
      ) : null}
    </QueryRulePopup>
  );
}

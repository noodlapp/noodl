import React from 'react';

import { QueryRulePopup } from '../QueryRulePopup';
import { RuleDropdown } from '../RuleDropdown';
import { RuleInput } from '../RuleInput';
import { _initializeRuleForProperty, _propertiesFromSchema } from '../utils';

export interface QueryRelationRuleEditPopupProps {
  query: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDeleteClicked: TSFixme;
}

export function QueryRelationRuleEditPopup(props: QueryRelationRuleEditPopupProps) {
  function onPropItemClicked(property) {
    const q = props.query;
    _initializeRuleForProperty(q, property, props.schema);
    props.onChange && props.onChange();
  }

  function onInputItemChanged(value) {
    props.query.input = value;
    props.onChange && props.onChange();
  }

  function onRelationClassItemClicked(value) {
    props.query.relatedTo = value;
    props.onChange && props.onChange();
  }

  function onRelationPropItemClicked(value) {
    props.query.relationProperty = value;
    props.onChange && props.onChange();
  }

  const q = props.query;
  const properties = _propertiesFromSchema(props.schema);

  const relationClasses = Object.keys(props.schema.relations);
  const relationProps = q.relatedTo ? props.schema.relations[q.relatedTo].map((r) => r.property) : [];

  return (
    <QueryRulePopup title="Edit filter rule" onDeleteClicked={props.onDeleteClicked}>
      <RuleDropdown label="PROPERTY" value={q.operator} dropdownItems={properties} onItemSelected={onPropItemClicked} />
      <RuleDropdown
        label="RELATED TO CLASS"
        value={q.relatedTo}
        dropdownItems={relationClasses}
        onItemSelected={onRelationClassItemClicked}
      />

      {q.relatedTo !== undefined ? (
        <RuleDropdown
          label="RELATION PROPERTY"
          value={q.relationProperty}
          dropdownItems={relationProps}
          onItemSelected={onRelationPropItemClicked}
        />
      ) : null}

      {q.relatedTo !== undefined && q.relationProperty !== undefined ? (
        <RuleInput label="INPUT" value={q.input} onChange={onInputItemChanged} />
      ) : null}
    </QueryRulePopup>
  );
}

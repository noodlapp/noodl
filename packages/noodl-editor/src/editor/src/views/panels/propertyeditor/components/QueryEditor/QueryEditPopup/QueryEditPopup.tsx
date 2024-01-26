import React from 'react';

import { QueryPointerRuleEditPopup } from '../QueryPointerRuleEditPopup';
import { QueryRelationRuleEditPopup } from '../QueryRelationRuleEditPopup';
import { QueryRuleEditPopup } from '../QueryRuleEditPopup';

export interface QueryEditPopupProps {
  query: TSFixme;
  schema: TSFixme;

  onDelete: TSFixme;
  onChange: TSFixme;
}

export function QueryEditPopup(props: QueryEditPopupProps) {
  const q = props.query;
  const propertySchema = props.schema.properties[q.property];

  // Relation rules
  if (q.operator === 'related to') {
    return (
      <QueryRelationRuleEditPopup
        onDeleteClicked={props.onDelete}
        query={q}
        schema={props.schema}
        onChange={props.onChange}
      />
    );
  } else if (propertySchema !== undefined && propertySchema.type === 'Pointer') {
    // Pointer rules
    return (
      <QueryPointerRuleEditPopup
        onDeleteClicked={props.onDelete}
        query={q}
        schema={props.schema}
        onChange={props.onChange}
      />
    );
  } else {
    // Property rules
    return (
      <QueryRuleEditPopup onDeleteClicked={props.onDelete} query={q} schema={props.schema} onChange={props.onChange} />
    );
  }
}

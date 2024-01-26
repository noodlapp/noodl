import React from 'react';

import { QueryGroup } from '../QueryGroup/QueryGroup';

export interface QueryFilterEditorProps {
  schema: TSFixme;
  filter: TSFixme;

  onChange: (filter: TSFixme) => void;
}

export function QueryFilterEditor(props: QueryFilterEditorProps) {
  let filter;

  if (props.filter !== undefined) {
    //we're going to modify nested parameters, so clone the object
    filter = JSON.parse(JSON.stringify(props.filter));
  } else {
    filter = { combinator: 'or', rules: [{ combinator: 'and', rules: [] }] };
  }

  return <QueryGroup query={filter} schema={props.schema} isTopLevel={true} onChange={() => props.onChange(filter)} />;
}

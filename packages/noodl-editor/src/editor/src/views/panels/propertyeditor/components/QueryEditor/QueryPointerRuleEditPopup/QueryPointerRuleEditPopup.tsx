import React from 'react';

import PopupLayer from '../../../../../popuplayer';
import { QueryRulePopup } from '../QueryRulePopup';
import { RuleDropdown } from '../RuleDropdown';
import { RuleInput } from '../RuleInput';
import { _initializeRuleForProperty, _propertiesFromSchema } from '../utils';

export interface QueryPointerRuleEditPopupProps {
  query: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDeleteClicked: TSFixme;
}

export function QueryPointerRuleEditPopup(props: QueryPointerRuleEditPopupProps) {
  function onPropItemClicked(property) {
    _initializeRuleForProperty(props.query, property, props.schema);
    props.onChange && props.onChange();
  }

  function onInputItemChanged(value) {
    props.query.input = value;
    props.onChange && props.onChange();
  }

  function onDeleteClicked() {
    PopupLayer.instance.hidePopouts();
    props.onDeleteClicked && props.onDeleteClicked();
  }

  const q = props.query;
  const properties = _propertiesFromSchema(props.schema);

  return (
    <QueryRulePopup title="Edit filter rule" onDeleteClicked={onDeleteClicked}>
      <RuleDropdown
        label="PROPERTY"
        value={q.property}
        dropdownItems={properties}
        onItemSelected={(p) => onPropItemClicked(p)}
      />

      <RuleInput label="INPUT" value={q.input} onChange={(value) => onInputItemChanged(value)} />
    </QueryRulePopup>
  );
}

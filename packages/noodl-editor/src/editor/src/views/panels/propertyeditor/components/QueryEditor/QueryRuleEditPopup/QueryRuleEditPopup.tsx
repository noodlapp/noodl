import React from 'react';

import { QueryRulePopup } from '../QueryRulePopup';
import { RuleDropdown } from '../RuleDropdown';
import { RuleInput } from '../RuleInput';
import { RuleValueOrInputLabel } from '../RuleValueOrInputLabel';
import { _formatValue, _initializeRuleForProperty, _operationsForType, _propertiesFromSchema } from '../utils';

export interface QueryRuleEditPopupProps {
  query: TSFixme;
  schema: TSFixme;

  onChange: TSFixme;
  onDeleteClicked: TSFixme;
}

export class QueryRuleEditPopup extends React.Component<QueryRuleEditPopupProps> {
  onPropItemClicked(property) {
    const q = this.props.query;
    _initializeRuleForProperty(q, property, this.props.schema);
    this.props.onChange && this.props.onChange();
  }

  onOpItemClicked(op) {
    this.props.query.operator = op;
    this.props.onChange && this.props.onChange();
  }

  onValueChanged(value) {
    const q = this.props.query;

    this.props.query.value = _formatValue(value, this.props.schema.properties[q.property]);
    this.props.onChange && this.props.onChange();
  }

  onInputNameChanged(value) {
    this.props.query.input = value;
    this.props.onChange && this.props.onChange();
  }

  onSourceClicked() {
    const q = this.props.query;

    //toggle between a value and an input
    q.input = q.input ? undefined : 'MyInput';
    this.props.onChange && this.props.onChange();
  }

  renderInputValue() {
    const q = this.props.query;
    const propertySchema = this.props.schema.properties[q.property];
    const isBool = propertySchema.type === 'Boolean';

    if (isBool) {
      return (
        <RuleDropdown
          label={<RuleValueOrInputLabel onClick={() => this.onSourceClicked()} isValue={true} />}
          value={q.value !== undefined ? (q.value === true ? 'True' : 'False') : null}
          dropdownItems={['True', 'False']}
          onItemSelected={(p) => this.onValueChanged(p === 'True')}
        />
      );
    } else {
      return (
        <RuleInput
          label={<RuleValueOrInputLabel onClick={() => this.onSourceClicked()} isValue={true} />}
          value={q.value}
          onChange={(value) => this.onValueChanged(value)}
        />
      );
    }
  }

  renderInputConnection() {
    return (
      <RuleInput
        label={<RuleValueOrInputLabel onClick={() => this.onSourceClicked()} isValue={false} />}
        value={this.props.query.input}
        onChange={(value) => this.onInputNameChanged(value)}
      />
    );
  }

  render() {
    const q = this.props.query;
    const properties = _propertiesFromSchema(this.props.schema);
    let operations;

    if (q.property) {
      const propertySchema = this.props.schema.properties[q.property];
      operations = _operationsForType[propertySchema.type];
    }

    const showValue =
      q.property !== undefined && q.operator !== undefined && q.operator !== 'exist' && q.operator !== 'not exist';

    return (
      <QueryRulePopup title="Edit filter rule" onDeleteClicked={this.props.onDeleteClicked}>
        <RuleDropdown
          label="PROPERTY"
          value={q.property}
          dropdownItems={properties}
          onItemSelected={(p) => this.onPropItemClicked(p)}
        />

        {q.property !== undefined ? (
          <RuleDropdown
            label="CONDITION"
            value={q.operator}
            dropdownItems={operations}
            onItemSelected={(p) => this.onOpItemClicked(p)}
          />
        ) : null}

        {showValue ? (q.input === undefined ? this.renderInputValue() : this.renderInputConnection()) : null}
      </QueryRulePopup>
    );
  }
}

import React from 'react';
import ReactDOM from 'react-dom';

import PopupLayer from '../../../../popuplayer';

export function openPopup(args) {
  const onChange = () => {
    args.onChange && args.onChange();
    renderPopup();
  };

  const onDelete = () => {
    args.onDelete && args.onDelete();
    PopupLayer.instance.hidePopouts();
  };

  const renderPopup = () => {
    const props = {
      ...args.props,
      onChange,
      onDelete
    };

    ReactDOM.render(React.createElement(args.reactComponent, props), div);
  };

  const div = document.createElement('div');
  div.style.display = 'flex';
  renderPopup();

  PopupLayer.instance.showPopout({
    content: { el: $(div) },
    attachTo: $(args.attachTo),
    position: 'right',
    onClose() {
      ReactDOM.unmountComponentAtNode(div);
    }
  });
}

const _supportedTypes = {
  Boolean: true,
  String: true,
  Number: true,
  Date: true,
  Pointer: true
};

export const _operationsForType = {
  Boolean: ['equal to', 'not equal to', 'exist', 'not exist'],
  String: ['equal to', 'not equal to', 'exist', 'not exist', 'contain'],
  Number: [
    'less than',
    'less than or equal to',
    'greater than',
    'greater than or equal to',
    'equal to',
    'not equal to',
    'exist',
    'not exist'
  ],
  Date: [
    'less than',
    'less than or equal to',
    'greater than',
    'greater than or equal to',
    'equal to',
    'not equal to',
    'exist',
    'not exist'
  ]
};

export function _propertiesFromSchema(schema) {
  const properties = Object.keys(schema.properties).filter((p) => {
    const propertySchema = schema.properties[p];
    return _supportedTypes[propertySchema.type];
  });
  if (schema.relations !== undefined) properties.push('related to');

  return properties;
}

export function _initializeRuleForProperty(rule, property, schema) {
  if (property !== 'related to') {
    rule.property = property;
    rule.operator = rule.value = rule.value = undefined;

    const propertySchema = schema.properties[property];
    if (propertySchema.type === 'Pointer') {
      rule.input = 'MyRecordId';
      rule.operator = 'points to';
    }

    delete rule.relatedTo;
    delete rule.relationProperty;
  } else {
    rule.property = undefined;
    rule.operator = 'related to';
    rule.value = undefined;
    rule.input = 'MyRelationRecordId';
    rule.relatedTo = undefined;
    rule.relationProperty = undefined;
  }
}

export function _formatValue(value, schema) {
  if (schema.type === 'Number') {
    return parseFloat(value);
  } else if (schema.type === 'Boolean') {
    return !!value;
  }

  return value;
}

const React = require('react');
const { useState, useEffect } = React;

const { propertyFromPort } = require('../../reactcomponents/propertyeditors');

function TextStylePopup(props) {
  const [styleName, setStyleName] = useState(props.style.name);

  const [style, setStyle] = useState(props.style.style);
  const stylesModel = props.stylesModel;

  useEffect(() => {
    const eventGroup = {};

    stylesModel.on(
      'styleRenamed',
      (event) => {
        if (event.oldName === styleName) {
          setStyleName(event.name);
        }
      },
      eventGroup
    );

    stylesModel.on(
      'styleChanged',
      (event) => {
        if (event.name === styleName) {
          setStyle(event.style);
        }
      },
      eventGroup
    );

    return () => {
      stylesModel.off(eventGroup);
    };
  }, [styleName]);

  //TODO: get from node library
  const properties = [
    { name: 'fontFamily', displayName: 'Font Family', type: 'font' },
    { name: 'fontSize', displayName: 'Font Size', type: { name: 'number', units: ['px'] } },
    { name: 'color', displayName: 'Color', type: 'color' },
    {
      name: 'letterSpacing',
      displayName: 'Letter Spacing',
      type: { name: 'number', units: ['px', 'em'] }
    },
    {
      name: 'lineHeight',
      displayName: 'Line Height',
      type: { name: 'number', units: ['', 'px', '%'] }
    },
    {
      name: 'textTransform',
      displayName: 'Case',
      type: {
        name: 'enum',
        enums: [
          { label: 'None', value: 'none' },
          { label: 'Uppercase', value: 'uppercase' },
          { label: 'Lowercase', value: 'lowercase' },
          { label: 'Capitalize', value: 'capitalize' }
        ]
      }
    }
  ];

  const setStyleProperty = (name, value) => {
    const newStyle = { ...style };
    if (value === '') {
      delete newStyle[name];
    } else {
      newStyle[name] = value;
    }

    stylesModel.setStyle('text', styleName, newStyle, { undo: true, label: 'change text style' });
  };

  return (
    <div style={{ padding: '10px' }}>
      {properties.map((prop) =>
        propertyFromPort(prop, style[prop.name], (newValue) => setStyleProperty(prop.name, newValue))
      )}
    </div>
  );
}

module.exports = TextStylePopup;

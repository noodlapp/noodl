const React = require('react');
const { useState, useEffect, useRef } = require('react');

const ColorPicker = require('../views/panels/propertyeditor/DataTypes/ColorPicker/colorpicker').default;
const FontPicker = require('../views/panels/propertyeditor/fontpicker').default;
const PopupLayer = require('../views/popuplayer');

require('./propertyeditors.css');

const GenericInputProperty = React.forwardRef((props, ref) => {
  const [inputValue, setInputValue] = useState(props.value || '');

  useEffect(() => {
    setInputValue(props.value);
  }, [props.value]);

  function onChange(newValue) {
    const changed = props.value !== newValue;
    changed && props.onChange && props.onChange(newValue);
  }

  return (
    <div className="propertyeditor-item" style={props.style} onClick={props.onClick} ref={ref}>
      <div style={{ width: '120px', flexShrink: 0, textAlign: 'right' }}>{props.label}</div>
      <input
        className="propertyeditor-item-input"
        type={props.type || 'string'}
        value={inputValue}
        style={{ flexGrow: 1, flexShrink: 1 }}
        onChange={(e) => {
          setInputValue(e.target.value);
          const changed = props.value !== e.target.value;
          changed && props.onEditChange && props.onEditChange(e.target.value);
        }}
        onFocus={props.onFocus}
        onBlur={(e) => {
          onChange(e.target.value);
          props.onBlur && props.onBlur(e);
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            e.target.blur();
          }
        }}
      />
    </div>
  );
});

function UnitDropdown(props) {
  const [open, setOpen] = useState(false);

  function onChange(newValue) {
    const changed = props.value !== newValue;
    changed && props.onChange && props.onChange(newValue);
  }

  return (
    <div
      className="sidebar-panel-dark-input propertyeditor-unit-dropdown"
      tabIndex="1" //hack to make onBlur trigger
      onBlur={() => setOpen(false)}
      onClick={() => setOpen(!open)}
    >
      <div>{props.value}</div>
      {open ? (
        <div className="property-input-dropdown propertyeditor-unit-dropdown-list">
          {props.units.map((unit) => (
            <div className="property-input-enum" key={unit} onClick={() => onChange(unit)}>
              {unit}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// props.value: an object with type {value, unit}
function GenericPropertyWithUnits(props) {
  const value = typeof props.value === 'object' ? props.value.value : undefined;
  const unit = typeof props.value === 'object' ? props.value.unit : props.units[0];

  return (
    <div style={{ display: 'flex' }}>
      <GenericInputProperty
        key={value}
        value={value}
        type="string"
        onChange={(newValue) => props.onChange && props.onChange({ value: newValue, unit })}
        label={props.label}
      />
      <UnitDropdown value={unit} units={props.units} onChange={(newUnit) => props.onChange({ value, unit: newUnit })} />
    </div>
  );
}

function ColorProperty(props) {
  const popupAnchor = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [color, setColor] = useState(props.value);

  useEffect(() => {
    if (!showColorPicker) return;

    const colorPicker = new ColorPicker();
    colorPicker.render();

    colorPicker.setColor(color);
    colorPicker.setColorChangedListener((color, commitChange) => {
      setColor(color);
      if (commitChange) {
        props.onChange && props.onChange(color);
      }
    });

    const popout = PopupLayer.instance.showPopout({
      content: colorPicker,
      attachTo: $(popupAnchor.current),
      position: 'right',
      onClose: () => {
        colorPicker.dispose();
      }
    });

    return () => {
      PopupLayer.instance.hidePopout(popout);
    };
  }, [showColorPicker]);

  function onChange(newValue) {
    setColor(newValue);
    props.onChange && props.onChange(newValue);
  }

  return (
    <div style={{ display: 'flex' }} tabIndex="1" onBlur={() => setShowColorPicker(false)}>
      <GenericInputProperty value={color} type="string" onChange={onChange} label={props.label} />
      <div
        className="color-thumbnail"
        style={{ marginTop: '1px', marginLeft: '2px' }}
        onClick={() => setShowColorPicker((s) => !s)}
      >
        <div ref={popupAnchor} className="color-thumbnail-content" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function FontProperty(props) {
  const ref = useRef(null);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const fontPickerRef = useRef(null);
  const [value, setValue] = useState(props.value);

  function onChange(newValue) {
    setValue(newValue);
    setShowFontPicker(false);
    const changed = newValue !== props.value;
    changed && props.onChange && props.onChange(newValue);
  }

  useEffect(() => {
    if (!showFontPicker) return;

    const fontPicker = new FontPicker({
      onItemSelected: onChange
    });
    fontPicker.render();
    fontPickerRef.current = fontPicker;

    const popout = PopupLayer.instance.showPopout({
      content: fontPicker,
      attachTo: $(ref.current),
      position: 'right'
    });

    return () => {
      PopupLayer.instance.hidePopout(popout);
      fontPickerRef.current = null;
    };
  }, [showFontPicker, onChange]);

  function onClick(e) {
    setShowFontPicker(true);
  }

  return (
    <GenericInputProperty
      ref={ref}
      key={value}
      value={value}
      type="string"
      onClick={onClick}
      onEditChange={(value) => {
        setValue(value);
        fontPickerRef.current && fontPickerRef.current.setFilter(value);
      }}
      onChange={onChange}
      label={props.label}
    />
  );
}

function EnumProperty(props) {
  const [value, setValue] = useState(props.value);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function onChange(newValue) {
    setValue(newValue);
    const changed = props.value !== newValue;
    changed && props.onChange && props.onChange(newValue);
  }

  const enums = props.enums || [];

  let dropdown = null;
  if (dropdownOpen) {
    dropdown = (
      <div className="property-input-dropdown propertyeditor-enums-dropdown">
        {enums.map(({ label, value }) => (
          <div
            key={value}
            className="property-input-enum"
            onClick={() => {
              onChange(value);
            }}
          >
            {label}
          </div>
        ))}
      </div>
    );
  }

  const selectedItem = enums.find((e) => e.value === value);
  const labelForCurrentValue = selectedItem ? selectedItem.label : value;

  return (
    <div
      className="propertyeditor-item"
      style={{ display: 'flex', ...props.style }}
      tabIndex="1" //hack to get the onBlur event
      onBlur={() => setDropdownOpen(false)}
      onClick={() => setDropdownOpen((open) => !open)}
    >
      <div style={{ width: '120px', flexShrink: 0, textAlign: 'right' }}>{props.label}</div>
      <div
        className="propertyeditor-item-input"
        style={{ display: 'flex', alignItems: 'center', flexGrow: 1, position: 'relative' }}
      >
        {labelForCurrentValue}
        <i className="property-input-dropdown-arrow fa fa-caret-down" style={{ position: 'absolute', right: '10px' }} />
        {dropdown}
      </div>
    </div>
  );
}

function propertyFromPort(port, value, onChange) {
  const type = port.type;

  const typeName = port.type.name ? port.type.name : port.type;

  const props = {
    value,
    label: port.displayName,
    onChange
  };

  switch (typeName) {
    case 'font':
      return <FontProperty key={port.name} {...props} />;
    case 'color':
      return <ColorProperty key={port.name} {...props} />;
    case 'enum':
      return <EnumProperty key={port.name} {...props} enums={type.enums} />;
  }

  if (type.units) {
    return <GenericPropertyWithUnits key={port.name} {...props} units={type.units} />;
  }

  return <GenericInputProperty key={port.name} {...props} />;
}

module.exports = {
  ColorProperty,
  FontProperty,
  GenericInputProperty,
  GenericPropertyWithUnits,
  EnumProperty,
  propertyFromPort
};

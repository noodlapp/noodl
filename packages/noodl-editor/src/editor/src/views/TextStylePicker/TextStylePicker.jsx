import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { StylesModel } from '@noodl-models/StylesModel';

import { IconName, IconSize } from '../../../../../../noodl-core-ui/src/components/common/Icon';
import { IconButton, IconButtonVariant } from '../../../../../../noodl-core-ui/src/components/inputs/IconButton';
import FontLoader from '../../utils/fontloader';
import PopupLayer from '../popuplayer';
import { ToastLayer } from '../ToastLayer/ToastLayer';
import TextStylePopup from './TextStylePopup';
import utils from './utils';

require('../../styles/propertyeditor/variantseditor.css');
require('./TextStylePicker.css');

function TextStylePicker(props) {
  const [stylesModel, setStylesModel] = useState(null);
  const [textStyles, setTextStyles] = useState([]);
  const [styleToEdit, setStyleToEdit] = useState(null);
  const [popupAnchor, setPopupAnchor] = useState(null);

  useLayoutEffect(() => {
    const stylesModel = new StylesModel();
    setStylesModel(stylesModel);

    setTextStyles(stylesModel.getStyles('text'));

    stylesModel.on('stylesChanged', (args) => {
      if (args.type === 'text') {
        setTextStyles(stylesModel.getStyles('text'));
      }
    });

    return () => {
      stylesModel.dispose();
    };
  }, []);

  useEffect(() => {
    if (!styleToEdit || !popupAnchor) return;

    const div = document.createElement('div');
    ReactDOM.render(<TextStylePopup style={styleToEdit} stylesModel={stylesModel} />, div);

    const popout = PopupLayer.instance.showPopout({
      content: { el: $(div) },
      attachTo: $(popupAnchor),
      position: 'right',
      onClose: () => {
        ReactDOM.unmountComponentAtNode(div);
      }
    });

    return () => {
      PopupLayer.instance.hidePopout(popout);
    };
  }, [styleToEdit, popupAnchor]);

  let filteredStyles = textStyles;

  const filterString = props.filter ? props.filter.toLowerCase() : undefined;

  if (filterString) {
    filteredStyles = textStyles.filter((style) => style.name.toLowerCase().includes(filterString));
  }

  filteredStyles.sort((a, b) => {
    if (!a.style || !a.style.fontSize || !b.style || !b.style.fontSize) return 0;
    return a.style.fontSize - b.style.fontSize;
  });

  const onDelete = (name) => {
    const { nodeCount, variantCount } = utils.getStyleUsage('textStyle', name);

    if (nodeCount > 0 || variantCount > 0) {
      let message = `Are you sure you want to delete <strong>${name}</strong>?<br>This text style is used by `;
      if (nodeCount) {
        message += `${nodeCount} ${nodeCount === 1 ? 'node' : 'nodes'}`;
      }
      if (variantCount) {
        if (nodeCount) {
          message += ' and ';
        }

        message += `${variantCount} ${variantCount === 1 ? 'variant' : 'variants'}`;
      }

      PopupLayer.instance.showConfirmModal({
        title: 'CONFIRM DELETE TEXT STYLE',
        message: message,
        confirmLabel: 'Yes, delete',
        onConfirm: () => {
          stylesModel.deleteStyle('text', name, { undo: true, label: 'delete text style' });
        }
      });
    } else {
      stylesModel.deleteStyle('text', name, { undo: true, label: 'delete text style' });
    }
  };

  const onChangeName = (name, newName) => {
    stylesModel.changeStyleName('text', name, newName, {
      undo: true,
      label: 'change text style name'
    });
  };

  const onCreateStyle = (name) => {
    //check if there's an existing style we should base the new style on
    const styleToCopyFrom = props.selectedStyle && textStyles.find((t) => t.name === props.selectedStyle);
    const newStyle = {};
    if (styleToCopyFrom) {
      Object.assign(newStyle, styleToCopyFrom.style);
    }

    //and copy the properties from the node
    for (const prop in props.newStyleProps) {
      newStyle[prop] = props.newStyleProps[prop];
    }

    props.createNewStyle(name, newStyle);
  };

  const onEdit = (style, popupAnchor) => {
    setStyleToEdit(style);
    setPopupAnchor(popupAnchor);
  };

  return (
    <div style={{ width: '270px', maxHeight: '400px', display: 'flex', flexDirection: 'column', fontSize: '16px' }}>
      <div style={{ overflow: 'hidden auto', flexGrow: 1 }}>
        <CreateNewStyle stylesModel={stylesModel} onCreateStyle={onCreateStyle} />
        {filteredStyles.map((style) => (
          <TextStyleItem
            key={style.name}
            style={style}
            onSelect={props.onItemSelected}
            onChangeName={onChangeName}
            onDelete={onDelete}
            onEdit={(popupAnchor) => onEdit(style, popupAnchor)}
            onEditingName={() => setStyleToEdit(null)}
          />
        ))}
      </div>
    </div>
  );
}

function TextStyleItem(props) {
  const [isEditing, setIsEditing] = useState(false);
  const [styleName, setStyleName] = useState(props.style.name);

  const popupAnchorRef = useRef(null);

  const onSelectClicked = (e) => {
    props.onSelect(props.style.name);
    e.stopPropagation();
  };

  const onDeleteClicked = (e) => {
    props.onDelete(props.style.name);
    e.stopPropagation();
  };

  const onEditStyleClicked = (e) => {
    props.onEdit(popupAnchorRef.current);
    e.stopPropagation();
  };

  const onEditClicked = (e) => {
    props.onEditingName();
    setIsEditing(true);
    setStyleName(props.style.name);
    e.stopPropagation();
  };

  const onInputKeyUp = (e) => {
    if (e.key === 'Enter') {
      const newName = e.target.value;
      if (newName && props.style.name !== newName) {
        props.onChangeName(props.style.name, newName);
      }
      setIsEditing(false);
    }
  };

  const fontStyle = props.style.style || {};

  //style object is in the following format: {fontSize: 12, unit: 'px', ...}
  //lets convert it to CSS
  const propertiesToIgnore = ['fontSize', 'lineHeight'];

  const css = {};
  for (const prop in fontStyle) {
    if (!propertiesToIgnore.includes(prop)) {
      const value = fontStyle[prop];
      css[prop] = typeof value === 'object' ? value.value + value.unit : value;
    }
  }

  if (fontStyle.fontFamily && fontStyle.fontFamily.indexOf('.') !== -1) {
    const fontPath = fontStyle.fontFamily;
    const paths = fontPath.split('/');
    const fileName = paths[paths.length - 1];
    const nameWithoutExtension = fileName.split('.')[0];
    const nameWithoutExtensionAndSpaces = nameWithoutExtension.replace(/\s/g, '');
    FontLoader.instance.loadFont(nameWithoutExtensionAndSpaces, fontPath);
    css.fontFamily = nameWithoutExtensionAndSpaces;
  }

  //if the text style color is too dark, add a light gray plate behind it
  if (css.color && colorToLuminance(css.color) < 0.5) {
    css.backgroundColor = '#ccc';
    css.padding = '0 4px';
  }

  if (isEditing) {
    return (
      <div className="variants-pick-variant-item">
        <input
          className="variants-input"
          type="text"
          autoFocus
          onChange={(e) => setStyleName(e.target.value)}
          onKeyUp={onInputKeyUp}
          value={styleName}
          onBlur={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="variants-pick-variant-item" onClick={onSelectClicked}>
      <div className="variant-item-name">
        <span style={css}>{props.style.name}</span>
      </div>
      <div className="variants-item-icon" onClick={onEditClicked}>
        <i className="fa fa-edit" />
      </div>
      <div className="variants-item-icon" onClick={onDeleteClicked}>
        <i className="fa fa-trash" />
      </div>
      <div className="textstyles-edit-style" onClick={onEditStyleClicked} ref={popupAnchorRef} />
    </div>
  );
}

function colorToLuminance(color) {
  const rgba = colorToRGBA(color);
  return 0.299 * rgba[0] + 0.587 * rgba[1] + 0.114 * rgba[2];
}

function colorToRGBA(color) {
  if (color === 'transparent' || !color) {
    return [0, 0, 0, 0];
  }

  if (color[0] !== '#') color = '#' + color;

  const numComponents = (color.length - 1) / 2;

  const result = [0, 0, 0, 1];
  for (let i = 0; i < numComponents; ++i) {
    const index = 1 + i * 2;
    result[i] = parseInt(color.substring(index, index + 2), 16) / 255;
  }

  return result;
}

function CreateNewStyle(props) {
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef(null);

  const onCreateNewStyle = () => {
    const name = inputRef.current.value;

    if (!name) return;

    if (props.stylesModel.styleExists('text', name)) {
      ToastLayer.showError('Style already exists');
    } else {
      props.onCreateStyle(name);
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <>
        <div className="variants-header">
          <span>New text style name</span>
        </div>
        <div className="variants-input-container">
          <input
            autoFocus
            className="variants-input"
            ref={inputRef}
            onKeyUp={(e) => e.key === 'Enter' && onCreateNewStyle()}
          />
          <button className="variants-button primary" onClick={onCreateNewStyle}>
            Create
          </button>
        </div>
      </>
    );
  } else {
    return (
      <div onClick={() => setIsCreating(true)} className="variants-header variants-add-header">
        <span>Create new text style</span>
        <IconButton
          icon={IconName.Plus}
          size={IconSize.Small}
          UNSAFE_className="add-button"
          variant={IconButtonVariant.OpaqueOnHover}
          onClick={() => setIsCreating(true)}
        />
      </div>
    );
  }
}

export default TextStylePicker;

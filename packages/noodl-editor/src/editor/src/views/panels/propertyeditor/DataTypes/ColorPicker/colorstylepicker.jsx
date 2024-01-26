import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';
import { StylesModel } from '@noodl-models/StylesModel';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButtonVariant, IconButton } from '@noodl-core-ui/components/inputs/IconButton';

import PopupLayer from '../../../../popuplayer';
import utils from '../../../../TextStylePicker/utils';
import { ToastLayer } from '../../../../ToastLayer/ToastLayer';
import ColorPicker from './colorpicker';

require('../../../../../styles/propertyeditor/variantseditor.css');

function getProjectColors(colorStyles) {
  const colorsNames = new Set();

  const components = ProjectModel.instance.getComponents();
  components.forEach((c) => {
    c.graph.forEachNode((node) => {
      const colorPorts = node.getPorts('input').filter((p) => p.type === 'color');
      const values = colorPorts.map((port) => node.getParameter(port.name));
      values
        .filter((name) => name)
        .forEach((name) => {
          colorsNames.add(name);
        });
    });
  });

  let colors = Array.from(colorsNames);
  colors = colors.filter((c) => !colorStyles.find((s) => s.name === c)); //remove all color styles from the list, so we only get the #HEX colors
  colors.sort();
  return colors;
}

function ColorStylePicker(props) {
  const [stylesModel, setStylesModel] = useState(null);

  const [colorStyles, setColorsStyles] = useState([]);
  const [projectColors, setProjectColors] = useState([]);

  const [styleToEdit, setStyleToEdit] = useState(null);
  const [popupAnchor, setPopupAnchor] = useState(null);

  //the color style picker is rendered in a popup/poput, and that system uses the height of the content to decide how big
  //the popup should be. And it needs that information directly on render.
  //this means we need to get all styles etc synchronously with the first render, which useLayoutEffect solves
  useLayoutEffect(() => {
    const stylesModel = new StylesModel();
    setStylesModel(stylesModel);

    const styles = stylesModel.getStyles('colors');
    setColorsStyles(styles);
    setProjectColors(getProjectColors(styles));

    stylesModel.on('stylesChanged', (args) => {
      if (args.type === 'colors') {
        const styles = stylesModel.getStyles('colors');
        setColorsStyles(styles);
      }
    });

    return () => {
      stylesModel.dispose();
    };
  }, []);

  let filteredStyles = colorStyles;
  let filteredProjectColors = projectColors;

  const filterString = props.filter ? props.filter.toLowerCase() : undefined;

  if (filterString) {
    filteredStyles = colorStyles.filter((style) => style.name.toLowerCase().includes(filterString));
    filteredProjectColors = projectColors.filter((color) => color.toLowerCase().includes(filterString));
  }

  const onItemSelected = (name) => props.onItemSelected(name);

  const onDelete = (name) => {
    const { nodeCount, variantCount } = utils.getStyleUsage('color', name);

    if (nodeCount > 0 || variantCount > 0) {
      let message = `Are you sure you want to delete <strong>${name}</strong>?<br>This color style is used by `;
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
        title: 'CONFIRM DELETE COLOR STYLE',
        message: message,
        confirmLabel: 'Yes, delete',
        onConfirm: () => {
          stylesModel.deleteStyle('colors', name, { undo: true, label: 'delete color style' });
        }
      });
    } else {
      stylesModel.deleteStyle('colors', name, { undo: true, label: 'delete color style' });
    }
  };

  const onChangeName = (name, newName) => {
    stylesModel.changeStyleName('colors', name, newName, {
      undo: true,
      label: 'change color style name'
    });
  };

  const onEditValue = (style, popupAnchor) => {
    setStyleToEdit(style);
    setPopupAnchor(popupAnchor);
  };

  useEffect(() => {
    if (!styleToEdit) return;

    const colorPicker = new ColorPicker();
    colorPicker.render();

    colorPicker.setColor(styleToEdit.style);

    colorPicker.setColorChangedListener((color, commitChange) => {
      if (commitChange) {
        stylesModel.setStyle('colors', styleToEdit.name, color, { undo: true, label: 'change color style' });
      }
    });

    const popout = PopupLayer.instance.showPopout({
      content: colorPicker,
      attachTo: $(popupAnchor),
      position: 'right'
    });

    return () => {
      PopupLayer.instance.hidePopout(popout);
    };
  }, [styleToEdit, popupAnchor]);

  return (
    <div
      style={{
        width: '230px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ overflow: 'hidden auto', flexGrow: 1, maxHeight: '600px' }}>
        <CreateNewStyle color={props.inputValue} stylesModel={stylesModel} onColorStyleCreated={onItemSelected} />

        {filteredStyles.map((style) => (
          <ColorStyleItem
            key={style.name}
            style={style}
            onSelect={onItemSelected}
            onChangeName={onChangeName}
            onEditValue={onEditValue}
            onDelete={onDelete}
            onEditingName={() => setStyleToEdit(null)}
            currentSelectedColor={props.inputValue}
          />
        ))}

        <ProjectColorsList
          colors={filteredProjectColors}
          onSelect={onItemSelected}
          currentSelectedColor={props.inputValue}
        />
      </div>
    </div>
  );
}

function ProjectColorsList(props) {
  if (props.colors.length === 0) {
    return null;
  }

  return (
    <>
      <div className="variants-header">
        <span>Colors in project</span>
      </div>

      {props.colors.map((color) => (
        <ColorItem
          key={color}
          color={color}
          onSelect={props.onSelect}
          currentSelectedColor={props.currentSelectedColor}
        />
      ))}
    </>
  );
}

function useScrollToIfSelected(ref, colorName, selectedColorName) {
  useEffect(() => {
    if (!ref.current || !colorName || !selectedColorName) return;
    if (colorName !== selectedColorName) return;

    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [ref.current, colorName]);
}

function ColorStyleItem(props) {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef(null);

  const [styleName, setStyleName] = useState(props.style.name);

  const isSelectedColor = props.style.name === props.currentSelectedColor;

  useScrollToIfSelected(ref, props.style.name, props.currentSelectedColor);

  const onSelectClicked = (e) => {
    props.onSelect(props.style.name);
    e.stopPropagation();
  };

  const onEditClicked = (e) => {
    props.onEditingName();
    setIsEditing(true);
    setStyleName(props.style.name);
    e.stopPropagation();
  };

  const onDeleteClicked = (e) => {
    props.onDelete(props.style.name);
    e.stopPropagation();
  };

  const onColorClicked = (e) => {
    e.stopPropagation();
    e.preventDefault();

    e.nativeEvent.stopPropagation();

    props.onEditValue(props.style, ref.current);
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
        <div className="color-thumbnail">
          <div className="color-thumbnail-content" style={{ backgroundColor: props.style.style }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="variants-pick-variant-item"
      onClick={onSelectClicked}
      ref={ref}
      style={{ backgroundColor: isSelectedColor ? 'var(--hover-bg-color)' : null }}
    >
      <div className="variant-item-name">{props.style.name}</div>
      <div className="variants-item-icon" onClick={onEditClicked}>
        <i className="fa fa-edit" />
      </div>
      <div className="variants-item-icon" onClick={onDeleteClicked}>
        <i className="fa fa-trash" />
      </div>
      <div className="color-thumbnail" onClick={onColorClicked}>
        <div className="color-thumbnail-content" style={{ backgroundColor: props.style.style }} />
      </div>
    </div>
  );
}

function ColorItem(props) {
  const ref = useRef();

  const onSelectClicked = (e) => {
    props.onSelect(props.color);
    e.stopPropagation();
  };

  useScrollToIfSelected(ref, props.color, props.currentSelectedColor);

  return (
    <div
      className="variants-pick-variant-item"
      onClick={onSelectClicked}
      ref={ref}
      style={{ backgroundColor: props.currentSelectedColor === props.color ? 'var(--hover-bg-color)' : null }}
    >
      <div className="variant-item-name">{props.color}</div>
      <div className="color-thumbnail">
        <div className="color-thumbnail-content" style={{ backgroundColor: props.color }} />
      </div>
    </div>
  );
}

function CreateNewStyle(props) {
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef(null);

  const color = ProjectModel.instance.resolveColor(props.color);

  const onCreateNewColorStyle = () => {
    const name = inputRef.current.value;

    if (!name) return;

    if (props.stylesModel.styleExists('colors', name)) {
      ToastLayer.showError('Style already exists');
    } else {
      props.stylesModel.setStyle('colors', name, color, {
        undo: true,
        label: `create new color style: ${name}`
      });
      props.onColorStyleCreated(name);
      setIsCreating(false);
      ToastLayer.showSuccess(`Created color style ${name}`);
    }
  };

  if (isCreating) {
    return (
      <>
        <div className="variants-header">
          <span>New color style name</span>
        </div>
        <div>
          <div className="variants-input-container">
            <input
              autoFocus
              className="variants-input"
              ref={inputRef}
              onKeyUp={(e) => e.key === 'Enter' && onCreateNewColorStyle()}
              style={{ marginRight: 0 }}
            />
            <div className="color-thumbnail" style={{ height: 27, width: 27 }}>
              <div className="color-thumbnail-content" style={{ backgroundColor: color }} />
            </div>
          </div>
          <div style={{ padding: '0 8px 8px', display: 'flex', alignItems: 'center' }}>
            <button className="variants-button primary" onClick={onCreateNewColorStyle} style={{ width: '100%' }}>
              Create
            </button>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <div className="variants-header variants-add-header">
        <span>Create new color style</span>

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

export default ColorStylePicker;

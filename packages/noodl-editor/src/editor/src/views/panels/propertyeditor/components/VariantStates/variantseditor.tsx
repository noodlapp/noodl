import React from 'react';
import ReactDOM from 'react-dom';

import { ProjectModel } from '@noodl-models/projectmodel';

import PopupLayer from '../../../../popuplayer';
import { ToastLayer } from '../../../../ToastLayer/ToastLayer';
import { PickVariantPopup } from './PickVariantPopup';

// Styles
require('../../../../../styles/propertyeditor/variantseditor.css');

export interface VariantsEditorProps {
  model: TSFixme;

  onEditVariant: () => void;
  onDoneEditingVariant: () => void;
}

type State = {
  variant: TSFixme;
  editMode?: boolean;
};

export class VariantsEditor extends React.Component<VariantsEditorProps, State> {
  model: VariantsEditorProps['model'];
  popout: any;
  popupAnchor: HTMLDivElement;

  constructor(props: VariantsEditorProps) {
    super(props);

    this.model = props.model;
    this.state = {
      variant: this.model.variant
      //   canUpdateVariant:_hasParameterChanges(this.model)
    };
  }

  componentDidMount() {
    /*   this.model.on(['variantUpdated','variantChanged','parametersChanged','stateTransitionsChanged','defaultStateTransitionChanged'],() => {
            this.setState({
                variant:this.model.variant,
                canUpdateVariant:_hasParameterChanges(this.model)
            })
        },this)*/

    this.model.on(
      ['variantChanged'],
      () => {
        this.setState({
          variant: this.model.variant
        });
      },
      this
    );

    ProjectModel.instance.on(
      ['variantRenamed'],
      (args) => {
        if (args.variant === this.model.variant)
          this.setState({
            variant: this.model.variant
          });
      },
      this
    );
  }

  componentWillUnmount() {
    this.model.off(this);
    ProjectModel.instance.off(this);

    if (this.popout) {
      PopupLayer.instance.hidePopout(this.popout);
    }
  }

  render() {
    let content;

    if (this.state.variant === undefined || this.state.variant.name === undefined) {
      //No variant
      content = (
        <div className="variants-section">
          <div className="variants-name-section" onClick={this.onPickVariant.bind(this)}>
            <label>Add style variant</label>
            <div className="variants-add-icon">
              <i className="fa fa-plus" style={{ color: 'white' }} />
            </div>
          </div>
        </div>
      );
    } else if (this.state.variant !== undefined && this.state.variant.name !== undefined && !this.state.editMode) {
      //Variant
      content = (
        <div className="variants-section">
          <div className="variants-name-section" onClick={this.onPickVariant.bind(this)}>
            <label>{this.state.variant.name}</label>
            <div className="variants-pick-icon" />
          </div>
          <button
            className="variants-button"
            style={{ marginLeft: '10px', width: '78px' }}
            onClick={this.onEditVariant.bind(this)}
          >
            Edit variant
          </button>
        </div>
      );
    } else if (this.state.variant !== undefined && this.state.variant.name !== undefined && this.state.editMode) {
      //Edit variant
      content = (
        <div style={{ width: '100%' }}>
          <div className="variants-edit-mode-header">Edit variant</div>
          <div className="variants-section">
            <label>{this.state.variant.name}</label>
            <button
              className="variants-button teal"
              style={{ marginLeft: 'auto', width: '78px' }}
              onClick={this.onDoneEditingVariant.bind(this)}
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="variants-editor" ref={(el) => (this.popupAnchor = el)}>
        {content}
      </div>
    );
  }

  performAddVariant(name) {
    if (ProjectModel.instance.findVariant(name, this.model.type)) {
      // Variant with name already exists for this node
      ToastLayer.showError('Variant with the name already exists');
      return;
    }

    this.model.createNewVariant(name, { undo: true });

    ToastLayer.showSuccess('Variant created');
  }

  onUpdateVariant(evt) {
    this.model.updateVariant({ undo: true });

    ToastLayer.showSuccess('Variant updated');

    evt.stopPropagation();
  }

  onEditVariant(evt) {
    this.props.onEditVariant && this.props.onEditVariant();

    this.setState({
      editMode: true
    });

    evt.stopPropagation();
  }

  onDoneEditingVariant(evt) {
    this.props.onDoneEditingVariant && this.props.onDoneEditingVariant();

    this.setState({
      editMode: false
    });

    evt.stopPropagation();
  }

  onPickVariant(evt) {
    const div = document.createElement('div');

    const variants = ProjectModel.instance.findVariantsForNodeType(this.model.type);
    const props = {
      showCreateNewVariant: variants.length === 0 || (variants.length === 1 && variants[0].name === undefined),
      model: this.model,
      hidePopout: () => {
        PopupLayer.instance.hidePopout(this.popout);
      }
    };
    ReactDOM.render(React.createElement(PickVariantPopup, props), div);

    this.popout = PopupLayer.instance.showPopout({
      content: { el: $(div) },
      attachTo: $(this.popupAnchor),
      position: 'right',
      onClose: function () {
        this.popout = undefined;
      }
    });

    evt.stopPropagation();
  }
}

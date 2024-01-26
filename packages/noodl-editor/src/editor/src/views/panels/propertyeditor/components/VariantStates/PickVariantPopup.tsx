import React from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';

import { ToastLayer } from '../../../../ToastLayer/ToastLayer';
import { PickVariantItem } from './PickVariantItem';

export interface PickVariantPopupProps {
  model: TSFixme;
  showCreateNewVariant: TSFixme;

  hidePopout: () => void;
}

type State = {
  variants: TSFixme;
  showCreateNewVariant: TSFixme;
};

export class PickVariantPopup extends React.Component<PickVariantPopupProps, State> {
  model: PickVariantPopupProps['model'];
  newVariantName: string;

  constructor(props: PickVariantPopupProps) {
    super(props);

    this.model = props.model;

    this.state = {
      variants: ProjectModel.instance.findVariantsForNodeType(this.model.type),
      showCreateNewVariant: props.showCreateNewVariant
    };
  }

  componentDidMount() {
    ProjectModel.instance.on(
      ['variantDeleted', 'variantCreated', 'variantRenamed'],
      () => {
        this.setState({
          variants: ProjectModel.instance.findVariantsForNodeType(this.model.type)
        });
      },
      this
    );
  }

  componentWillUnmount() {
    ProjectModel.instance.off(this);
  }

  onPickVariant(variant) {
    this.model.setVariant(variant, { undo: true });
    this.props.hidePopout();
  }

  onDeleteVariant(variant) {
    if (ProjectModel.instance.isVariantUsed(variant)) {
      ToastLayer.showError('Cannot delete variant that is in use');
      return;
    }

    ProjectModel.instance.deleteVariant(variant, { undo: true });
  }

  onRenameVariant(variant, name) {
    if (name === undefined || name.length === 0) {
      ToastLayer.showError('Must provide name for variant');
      return;
    }

    if (ProjectModel.instance.findVariant(name, this.model.type)) {
      // Variant with name already exists for this node
      ToastLayer.showError('Variant with the name already exists');
      return;
    }

    ProjectModel.instance.renameVariant(variant, name, { undo: true });

    ToastLayer.showSuccess('Variant renamed');
  }

  performAddVariant(name) {
    if (name === undefined || name.length === 0) {
      ToastLayer.showError('Must provide name for variant');
      return;
    }

    if (ProjectModel.instance.findVariant(name, this.model.type)) {
      // Variant with name already exists for this node
      ToastLayer.showError('Variant with the name already exists');
      return;
    }

    this.model.createNewVariant(name, { undo: true });

    ToastLayer.showSuccess('Variant created');

    this.props.hidePopout();
  }

  onKeyUp(e) {
    if (e.key === 'Enter') {
      this.performAddVariant(e.target.value);
    }
  }

  onCreateNewVariantClicked() {
    this.setState({
      showCreateNewVariant: true
    });
  }

  renderVariants() {
    return this.state.variants.map((v) => (
      <PickVariantItem
        key={v.typename + v.name}
        variant={v}
        onRenameVariant={this.onRenameVariant.bind(this, v)}
        onDeleteVariant={this.onDeleteVariant.bind(this, v)}
        onPickVariant={this.onPickVariant.bind(this, v)}
      />
    ));
  }

  render() {
    let header;
    if (this.state.showCreateNewVariant) {
      //note about autoFocus on the input. It doesn't work, probably because this component is mounted on a non-react component, so maybe it creates
      //the input before the component is mounted to the DOM. A ref callback with a short timeout solves it.
      header = (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
          <div className="variants-header">
            <span>New variant name</span>
          </div>
          <div className="variants-input-container">
            <input
              className="variants-input"
              ref={(ref) => ref && setTimeout(() => ref.focus(), 10)}
              autoFocus
              onKeyUp={this.onKeyUp.bind(this)}
              onChange={(e) => (this.newVariantName = e.target.value)}
            />
            <button className="variants-button primary" onClick={(e) => this.performAddVariant(this.newVariantName)}>
              Create
            </button>
          </div>
        </div>
      );
    } else {
      header = (
        <div onClick={this.onCreateNewVariantClicked.bind(this)} className="variants-header variants-add-header">
          <div>Create new variant</div>
          <i className="fa fa-plus" />
        </div>
      );
    }

    const hasVariant = this.model.variant && this.model.variant.name !== undefined;

    return (
      <div style={{ width: '230px', display: 'flex', flexDirection: 'column' }}>
        {header}
        {hasVariant ? (
          <div
            className="variants-pick-variant-item"
            onClick={(e) => {
              const v = ProjectModel.instance.findVariant(undefined, this.model.type);
              this.onPickVariant(v);
              e.stopPropagation();
            }}
          >
            <div className="variants-add-icon" style={{ marginLeft: '10px', opacity: 1 }}>
              <i className="fa fa-close" />
            </div>
            <div className="variant-item-name" style={{ paddingLeft: '0px' }}>
              Remove variant from node
            </div>
          </div>
        ) : null}
        <div style={{ overflowY: 'auto' }}>{this.renderVariants()}</div>
      </div>
    );
  }
}

import React from 'react';

export interface PickVariantItemProps {
  variant: TSFixme;

  onPickVariant: () => void;
  onRenameVariant: (name: string) => void;
  onDeleteVariant: () => void;
}

type State = {
  editMode: boolean;
  newVariantName: TSFixme;
};

export class PickVariantItem extends React.Component<PickVariantItemProps, State> {
  constructor(props: PickVariantItemProps) {
    super(props);

    this.state = {
      editMode: false,
      newVariantName: props.variant.name
    };
  }

  onRenameVariantClicked(e) {
    this.setState({
      editMode: true
    });

    e.stopPropagation();
  }

  onRenameVariant(e) {
    if (e.key === 'Enter') {
      this.props.onRenameVariant(this.state.newVariantName);
      this.setState({
        editMode: false
      });
    }
  }

  render() {
    if (this.state.editMode) {
      return (
        <div className="variants-pick-variant-item">
          <input
            className="variants-input"
            value={this.state.newVariantName}
            autoFocus
            onChange={(e) => this.setState({ newVariantName: e.target.value })}
            onKeyUp={(e) => this.onRenameVariant(e)}
          />
        </div>
      );
    }

    return (
      <div
        className="variants-pick-variant-item"
        onClick={(e) => {
          this.props.onPickVariant();
          e.stopPropagation();
        }}
      >
        <div className="variant-item-name">{this.props.variant.name}</div>
        <div
          className="variants-item-icon"
          onClick={(e) => {
            this.onRenameVariantClicked(e);
            e.stopPropagation();
          }}
        >
          <i className="fa fa-edit" />
        </div>
        <div
          className="variants-item-icon"
          onClick={(e) => {
            this.props.onDeleteVariant();
            e.stopPropagation();
          }}
        >
          <i className="fa fa-trash" />
        </div>
      </div>
    );
  }
}

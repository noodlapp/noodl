import React from 'react';

export interface VisualStateTransitionProps {
  model: TSFixme;
  transition: TSFixme;
  selected: boolean;

  onClick?: () => void;
}

export class VisualStateTransition extends React.Component<VisualStateTransitionProps> {
  constructor(props: VisualStateTransitionProps) {
    super(props);
  }

  onResetClicked() {
    // Reset to default
    this.props.model.setStateTransition(this.props.transition.name, undefined, {
      undo: true,
      label: 'reset state transition'
    });
  }

  onToggleEnabled() {
    const _transition = this.props.model.getStateTransition(this.props.transition.name);
    const hasTransition = _transition !== undefined && _transition.curve !== undefined;

    if (hasTransition) {
      // Force disable a transition
      this.props.model.setStateTransition(
        this.props.transition.name,
        {},
        { undo: true, label: 'disable state transition' }
      );
    } else {
      // Force enable a transition
      this.props.model.setStateTransition(
        this.props.transition.name,
        { curve: [0.0, 0.0, 0.58, 1.0], dur: 300, delay: 0 },
        { undo: true, label: 'enable state transition' }
      );
    }
  }

  render() {
    const isDefault = !this.props.model.hasStateTransition(this.props.transition.name);
    const _transition = this.props.model.getStateTransition(this.props.transition.name);
    const hasTransition = _transition !== undefined && _transition.curve !== undefined;

    return (
      <div
        className={
          'visual-state-default-transition' + (isDefault ? ' default' : '') + (this.props.selected ? ' selected' : '')
        }
        style={{ display: 'flex', alignItems: 'center' }}
        onClick={(e) => this.props.onClick && this.props.onClick()}
      >
        <div className="label">
          <span style={{ marginRight: '10px', flexGrow: 1 }}>{this.props.transition.displayName}</span>
          <div
            className={'visual-state-transition-curve-button' + (hasTransition ? ' enabled' : '')}
            onClick={this.onToggleEnabled.bind(this)}
          >
            {hasTransition ? 'Disable' : 'Enable'}
          </div>
        </div>
        <span
          className="visual-state-transition-changed-dot"
          style={{ visibility: !isDefault ? 'visible' : 'hidden' }}
          onClick={this.onResetClicked.bind(this)}
        ></span>
      </div>
    );
  }
}

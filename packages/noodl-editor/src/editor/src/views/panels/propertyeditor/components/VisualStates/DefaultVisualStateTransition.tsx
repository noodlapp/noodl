import React from 'react';

export interface DefaultVisualStateTransitionProps {
  model: TSFixme;
  selected: boolean;

  onClick?: () => void;
}

export class DefaultVisualStateTransition extends React.Component<DefaultVisualStateTransitionProps> {
  constructor(props: DefaultVisualStateTransitionProps) {
    super(props);
  }

  onResetClicked() {
    this.props.model.setDefaultStateTransition(undefined, { undo: true, label: 'default transition reset' });
  }

  onToggleEnabled() {
    const transition = this.props.model.getDefaultStateTransition();
    const hasTransition = transition !== undefined && transition.curve !== undefined;

    if (hasTransition) {
      // Force disable a transition
      this.props.model.setDefaultStateTransition({}, { undo: true, label: 'disable default transition' });
    } else {
      // Force enable a transition
      this.props.model.setDefaultStateTransition(
        { curve: [0.0, 0.0, 0.58, 1.0], dur: 300, delay: 0 },
        { undo: true, label: 'enable default transition' }
      );
    }
  }

  render() {
    const isDefault = !this.props.model.hasDefaultStateTransition();
    const transition = this.props.model.getDefaultStateTransition();
    const hasTransition = transition !== undefined && transition.curve !== undefined;

    return (
      <div
        className={
          'visual-state-default-transition' + (isDefault ? ' default' : '') + (this.props.selected ? ' selected' : '')
        }
        style={{ display: 'flex', alignItems: 'center' }}
        onClick={(e) => this.props.onClick && this.props.onClick()}
      >
        <div className="label">
          <span style={{ flexGrow: 1 }}>All properties</span>
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
        />
      </div>
    );
  }
}

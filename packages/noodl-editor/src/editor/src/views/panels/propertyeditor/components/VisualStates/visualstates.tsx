import React from 'react';
import ReactDOM from 'react-dom';

import { TransitionEditor } from './TransitionEditor';

// Styles
require('../../../../../styles/propertyeditor/visualstates.css');

export interface VisualStatesProps {
  model: TSFixme;
  portsView: TSFixme;

  onVisualStateChanged: (state: TSFixme) => void;
}

type State = {
  visualStates: TSFixme;
  selectedVisualState: TSFixme;
  visualStateTransitions: TSFixme;
  showTransitions?: boolean;
  showStatesSelector?: boolean;
};

export class VisualStates extends React.Component<VisualStatesProps, State> {
  popupAnchor: TSFixme;

  constructor(props: VisualStatesProps) {
    super(props);

    const states = props.model.getVisualStates();
    this.state = {
      visualStates: states,
      selectedVisualState: states[0],
      visualStateTransitions: props.model.getPossibleTransitionsForState(states[0].name)
    };

    props.model.on(['parametersChanged'], () => {
      this.setState({
        visualStateTransitions: props.model.getPossibleTransitionsForState(this.state.selectedVisualState.name)
      });
    });
  }

  onVisualStateClicked(state) {
    this.props.onVisualStateChanged(state);
    this.setState({
      selectedVisualState: state,
      visualStateTransitions: this.props.model.getPossibleTransitionsForState(state.name)
    });
  }

  onToggleTransitionsClicked() {
    this.setState({
      showTransitions: !this.state.showTransitions
    });
  }

  renderVisualStates() {
    return this.state.visualStates.map((state) => (
      // eslint-disable-next-line react/jsx-key
      <div className="property-editor-visual-state-item" onClick={this.onVisualStateClicked.bind(this, state)}>
        <div
          className={
            'property-editor-visual-state-item-label ' + (this.state.selectedVisualState === state ? 'selected' : '')
          }
        >
          {state.label}
        </div>
      </div>
    ));
  }

  onCurrentStateClicked() {
    this.setState({
      showStatesSelector: !this.state.showStatesSelector
    });
  }

  onTransitionsClicked(evt) {
    const div = document.createElement('div');

    const props = {
      model: this.props.model,
      visualState: this.state.selectedVisualState
    };
    ReactDOM.render(React.createElement(TransitionEditor, props), div);

    this.props.portsView.showPopout({
      arrowColor: '#444444',
      content: { el: $(div) },
      attachTo: $(this.popupAnchor),
      position: 'right'
    });

    evt.stopPropagation();
  }

  render() {
    return (
      <div
        className="variants-section property-editor-visual-states"
        style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        ref={(el) => (this.popupAnchor = el)}
      >
        <div className="variants-name-section" onClick={this.onCurrentStateClicked.bind(this)}>
          <label>{this.state.selectedVisualState.label} state</label>
          <div className="variants-pick-icon" />

          {this.state.showStatesSelector ? (
            <div
              className="visual-states-popup"
              style={{ position: 'absolute', zIndex: '10', top: '20px', right: '70px' }}
            >
              {this.renderVisualStates()}
            </div>
          ) : null}
        </div>

        {this.state.visualStateTransitions.length > 0 ? (
          <div className="variants-button" onClick={this.onTransitionsClicked.bind(this)}>
            Transitions
          </div>
        ) : null}
      </div>
    );
  }
}

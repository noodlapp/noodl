import React from 'react';

import { CurveEditor } from '../../DataTypes/CurveEditor';
import { DefaultVisualStateTransition } from './DefaultVisualStateTransition';
import { VisualStateTransition } from './VisualStateTransition';

export interface TransitionEditorProps {
  model: TSFixme;
  visualState: TSFixme;
}

type State = {
  showCurveEditor?: TSFixme;
  curve?: TSFixme;
  defaultCurve?: TSFixme;
  selectedTransition?: TSFixme;
  transitions: TSFixme;
  editingTransition?: TSFixme;
};

export class TransitionEditor extends React.Component<TransitionEditorProps, State> {
  constructor(props: TransitionEditorProps) {
    super(props);

    this.state = {
      transitions: props.model.getPossibleTransitionsForState(props.visualState.name)
    };
  }

  componentDidMount() {
    this.props.model.on(
      ['stateTransitionChanged', 'defaultStateTransitionChanged'],
      () => {
        let curve;
        if (this.state.editingTransition === undefined) {
          curve = this.props.model.getDefaultStateTransition();
        }

        this.setState({
          curve: curve,
          defaultCurve: curve || { curve: [0.0, 0.0, 0.58, 1.0], dur: 300, delay: 0 },
          transitions: this.props.model.getPossibleTransitionsForState(this.props.visualState.name)
        });
      },
      this
    );

    if (this.props.visualState.name === 'neutral') {
      this.onDefaultStateTransitionClicked(); // Select default transition
    } else {
      this.onStateTransitionClicked(this.state.transitions[0]); // Select first transition
    }
  }

  componentWillUnmount() {
    this.props.model.off(this);
  }

  onDefaultStateTransitionClicked() {
    const transition = this.props.model.getDefaultStateTransition();
    this.setState({
      showCurveEditor: transition !== undefined && transition.curve !== undefined,
      curve: transition,
      defaultCurve: transition || { curve: [0.0, 0.0, 0.58, 1.0], dur: 300, delay: 0 },
      selectedTransition: undefined
    });
  }

  onStateTransitionClicked(transition) {
    const _transition = this.props.model.getStateTransition(transition.name);
    this.setState({
      showCurveEditor: _transition !== undefined && _transition.curve !== undefined,
      curve: _transition,
      defaultCurve: _transition || { curve: [0.0, 0.0, 0.58, 1.0], dur: 300, delay: 0 },
      selectedTransition: transition
    });
  }

  onCurveUpdated(curve, drag) {
    if (this.state.selectedTransition === undefined) {
      const undoArgs = { undo: true, label: 'default transition changed' };
      this.props.model.setDefaultStateTransition(curve, drag ? undefined : undoArgs);
    } else {
      const undoArgs = { undo: true, label: 'default transition changed' };
      this.props.model.setStateTransition(this.state.selectedTransition.name, curve, drag ? undefined : undoArgs);
    }
  }

  renderTransitionProperties() {
    // Sort into groups
    const groups = {};
    this.state.transitions.forEach((t) => {
      if (!groups[t.group]) groups[t.group] = [];
      groups[t.group].push(t);
    });

    return (
      <div style={{ padding: '8px' }}>
        <DefaultVisualStateTransition
          model={this.props.model}
          selected={this.state.selectedTransition === undefined && this.state.showCurveEditor}
          onClick={this.onDefaultStateTransitionClicked.bind(this)}
        />

        {Object.keys(groups)
          .sort()
          .map((group) => (
            // eslint-disable-next-line react/jsx-key
            <div>
              <div className="visual-states-group-header">{group}</div>
              {groups[group].map((transition) => (
                // eslint-disable-next-line react/jsx-key
                <VisualStateTransition
                  model={this.props.model}
                  selected={this.state.selectedTransition === transition && this.state.showCurveEditor}
                  transition={transition}
                  onClick={this.onStateTransitionClicked.bind(this, transition)}
                ></VisualStateTransition>
              ))}
            </div>
          ))}
      </div>
    );
  }

  render() {
    return (
      <div className="visual-states-transition-popup">
        <div className="visual-states-transitions-header">Transitions to {this.props.visualState.label}</div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '330px', height: '100%', position: 'relative' }}>
            {this.renderTransitionProperties()}
          </div>
          {this.state.showCurveEditor ? (
            <div style={{ width: '270px', height: '100%', position: 'relative' }}>
              <CurveEditor
                value={this.state.curve}
                default={this.state.defaultCurve}
                onUpdate={this.onCurveUpdated.bind(this)}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

import React from 'react';
import Draggable from 'react-draggable';

import EaseCurves from '../../../easecurves';
import { Noodl } from '../../../types';

export interface DragProps extends Noodl.ReactProps {
  inputPositionX: number;
  inputPositionY: number;

  enabled: boolean;
  scale: number;
  axis: 'x' | 'y' | 'both';

  useParentBounds: boolean;

  onStart?: () => void;
  onStop?: () => void;
  onDrag?: () => void;

  positionX?: (value: number) => void;
  positionY?: (value: number) => void;
  deltaX?: (value: number) => void;
  deltaY?: (value: number) => void;
}

function setDragValues(event, props) {
  props.positionX && props.positionX(event.x);
  props.positionY && props.positionY(event.y);
  props.deltaX && props.deltaX(event.deltaX);
  props.deltaY && props.deltaY(event.deltaY);
}

type State = {
  x: number
  y: number
}

export class Drag extends React.Component<DragProps, State> {
  snapToPositionXTimer: any;
  snapToPositionYTimer: any;

  constructor(props: DragProps) {
    super(props);
    this.state = { x: 0, y: 0 } satisfies State;
  }

  snapToPosition({ timerScheduler, propCallback, duration, axis, endValue }) {
    const _this = this;
    return timerScheduler
      .createTimer({
        duration: duration === undefined ? 300 : duration,
        startValue: this.state[axis],
        endValue: endValue,
        ease: EaseCurves.easeOut,
        onRunning: function (t) {
          const value = this.ease(this.startValue, this.endValue, t);
          // @ts-expect-error Either x or y...
          _this.setState({ [axis]: value });
          propCallback && propCallback(value);
        }
      })
      .start();
  }

  componentDidMount() {
    const x = this.props.inputPositionX ? this.props.inputPositionX : 0;
    const y = this.props.inputPositionY ? this.props.inputPositionY : 0;

    this.setState({ x, y });
    setDragValues({ x, y, deltaX: 0, deltaY: 0 }, this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps: DragProps) {
    const props = this.props;

    if (props.inputPositionX !== nextProps.inputPositionX) {
      this.setState({ x: nextProps.inputPositionX });
      props.positionX && props.positionX(nextProps.inputPositionX);
      props.deltaX && props.deltaX(nextProps.inputPositionX - props.inputPositionX);
    }
    if (props.inputPositionY !== nextProps.inputPositionY) {
      this.setState({ y: nextProps.inputPositionY });
      props.positionY && props.positionY(nextProps.inputPositionY);
      props.deltaY && props.deltaY(nextProps.inputPositionY - props.inputPositionY);
    }
  }

  snapToPositionX(x, duration) {
    if (this.state.x === x) return;

    this.snapToPositionXTimer && this.snapToPositionXTimer.stop();
    this.snapToPositionXTimer = this.snapToPosition({
      timerScheduler: this.props.noodlNode.context.timerScheduler,
      propCallback: this.props.positionX,
      duration,
      axis: 'x',
      endValue: x
    });
  }

  snapToPositionY(y, duration) {
    if (this.state.y === y) return;

    this.snapToPositionYTimer && this.snapToPositionYTimer.stop();
    this.snapToPositionYTimer = this.snapToPosition({
      timerScheduler: this.props.noodlNode.context.timerScheduler,
      propCallback: this.props.positionY,
      duration,
      axis: 'y',
      endValue: y
    });
  }

  render() {
    const props = this.props;
    const bounds = props.useParentBounds ? 'parent' : undefined;

    let child;
    if (React.Children.count(props.children) > 0) {
      child = React.Children.toArray(props.children)[0];
    } else {
      return null;
    }

    return (
      <Draggable
        axis={props.axis}
        bounds={bounds}
        disabled={props.enabled === false}
        scale={props.scale || 0}
        position={{ x: this.state.x, y: this.state.y }}
        onStart={(e, data) => {
          setDragValues(data, props);
          props.onStart && props.onStart();
          this.snapToPositionXTimer && this.snapToPositionXTimer.stop();
          this.snapToPositionYTimer && this.snapToPositionYTimer.stop();
        }}
        onStop={(e, data) => {
          if (props.axis === 'x' || props.axis === 'both') {
            this.setState({ x: data.x });
          }
          if (props.axis === 'y' || props.axis === 'both') {
            this.setState({ y: data.y });
          }
          props.positionX && props.positionX(data.x);
          props.positionY && props.positionY(data.y);
          props.onStop && props.onStop();
        }}
        onDrag={(e, data) => {
          setDragValues(data, props);
          props.onDrag && props.onDrag();
        }}
      >
        {React.cloneElement(child, { parentLayout: props.parentLayout })}
      </Draggable>
    );
  }
}

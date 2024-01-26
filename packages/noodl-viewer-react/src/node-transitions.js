import BezierEasing from 'bezier-easing';

const EaseCurves = require('./easecurves');

export default function transitionParameter(node, name, endValue, transition) {
  if (node._transitions && node._transitions[name]) {
    node._transitions[name].stop();
    delete node._transitions[name];
  }

  const startValue = node.getInputValue(name);

  const input = node.getInput(name);

  let animation;

  if (input && input.type === 'color') {
    animation = colorAnimation(
      node.context.styles.resolveColor(startValue),
      node.context.styles.resolveColor(endValue)
    );
  } else if (typeof startValue === 'number' && typeof endValue === 'number') {
    animation = numberAnimation(startValue, endValue);
  } else if (
    typeof startValue === 'object' &&
    startValue.hasOwnProperty('value') &&
    typeof endValue === 'object' &&
    endValue.hasOwnProperty('value')
  ) {
    animation = numberAnimation(startValue.value, endValue.value);
  }

  if (animation) {
    if (!node._transitions) node._transitions = {};

    const ease = BezierEasing(transition.curve);

    node._transitions[name] = node.context.timerScheduler.createTimer({
      duration: transition.dur,
      onRunning: (t) => {
        const v = animation(ease.get(t));
        node.queueInput(name, v);
      },
      onFinish: () => {
        delete node._transitions[name];
      }
    });

    node._transitions[name].start();
  } else {
    //no transition supported for this parameter type, so just set it
    node.queueInput(name, endValue);
  }
}

function numberAnimation(start, end) {
  return (t) => {
    return EaseCurves.linear(start, end, t);
  };
}

function setRGBA(result, hex) {
  if (hex === 'transparent' || !hex) {
    result[3] = 0;
    return;
  }

  const numComponents = (hex.length - 1) / 2;

  for (let i = 0; i < numComponents; ++i) {
    const index = 1 + i * 2;
    result[i] = parseInt(hex.substring(index, index + 2), 16);
  }
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbaToHex(rgba) {
  return '#' + componentToHex(rgba[0]) + componentToHex(rgba[1]) + componentToHex(rgba[2]) + componentToHex(rgba[3]);
}

function colorAnimation(start, end) {
  const rgba0 = [0, 0, 0, 255];
  setRGBA(rgba0, start);

  const rgba1 = [0, 0, 0, 255];
  setRGBA(rgba1, end);

  if (!start || start === 'transparent') {
    rgba0[0] = rgba1[0];
    rgba0[1] = rgba1[1];
    rgba0[2] = rgba1[2];
  }
  if (!end || end === 'transparent') {
    rgba1[0] = rgba0[0];
    rgba1[1] = rgba0[1];
    rgba1[2] = rgba0[2];
  }

  const rgba = [0, 0, 0, 0];

  return (t) => {
    rgba[0] = Math.floor(EaseCurves.linear(rgba0[0], rgba1[0], t));
    rgba[1] = Math.floor(EaseCurves.linear(rgba0[1], rgba1[1], t));
    rgba[2] = Math.floor(EaseCurves.linear(rgba0[2], rgba1[2], t));
    rgba[3] = Math.floor(EaseCurves.linear(rgba0[3], rgba1[3], t));

    return rgbaToHex(rgba);
  };
}

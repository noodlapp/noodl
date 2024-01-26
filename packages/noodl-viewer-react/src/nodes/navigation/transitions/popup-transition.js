const Transition = require('./transition');
const BezierEasing = require('bezier-easing');

class PopupTransition extends Transition {
  constructor(from, to, params) {
    super();

    this.from = from;
    this.to = to;

    this.timing = params.timing || { curve: [0.0, 0.0, 0.58, 1.0], dur: 300, delay: 0 };
    this.distance = params.shift || { value: 25, unit: '%' };
    if (typeof this.distance === 'number') this.distance = { value: this.distance, unit: '%' };
    this.direction = params.direction || 'Right';

    this.timing.curve[0] = Math.min(1, Math.max(0, this.timing.curve[0]));
    this.timing.curve[2] = Math.min(1, Math.max(0, this.timing.curve[2]));
    this.ease = BezierEasing.apply(null, this.timing.curve).get;

    this.fadein = params.fadein === undefined ? false : params.fadein;

    this.zoom = params.zoom || { value: 25, unit: '%' };
    if (typeof this.zoom === 'number') this.zoom = { value: this.zoom, unit: '%' };
  }

  update(t) {
    if (this.direction === 'In' || this.direction === 'Out') {
      var zoom = this.zoom.value / 100;

      zoom = this.direction === 'Out' ? -zoom : zoom;

      this.to.setStyle({
        transform: 'scale(' + (1 - zoom * (1 - t)) + ')',
        opacity: this.crossfade ? t : 1
      });
    } else {
      var dist = this.distance.value;
      var unit = this.distance.unit;

      const targets = {
        Up: { x: 0, y: -1 },
        Down: { x: 0, y: 1 },
        Left: { x: -1, y: 0 },
        Right: { x: 1, y: 0 }
      };
      const target = {
        x: targets[this.direction].x * dist,
        y: targets[this.direction].y * dist
      };

      this.to.setStyle({
        transform: 'translate(' + target.x * (t - 1) + unit + ',' + target.y * (t - 1) + unit + ')',
        opacity: this.fadein ? t : 1
      });
    }
  }

  forward(t) {
    var _t = this.ease(t);
    this.update(_t);
  }

  back(t) {
    var _t = this.ease(t);
    this.update(1 - _t);
  }

  static ports(parameters) {
    var ports = [];

    ports.push({
      name: 'tr-direction',
      displayName: 'Direction',
      group: 'Transition',
      type: { name: 'enum', enums: ['Right', 'Left', 'Up', 'Down', 'In', 'Out'] },
      default: 'Right',
      plug: 'input'
    });

    if (parameters['tr-direction'] === 'In' || parameters['tr-direction'] === 'Out') {
      ports.push({
        name: 'tr-zoom',
        displayName: 'Zoom',
        group: 'Transition',
        type: { name: 'number', units: ['%'] },
        default: { value: 25, unit: '%' },
        plug: 'input'
      });
    } else {
      ports.push({
        name: 'tr-shift',
        displayName: 'Shift Distance',
        group: 'Transition',
        type: { name: 'number', units: ['%', 'px'] },
        default: { value: 25, unit: '%' },
        plug: 'input'
      });
    }

    ports.push({
      name: 'tr-fadein',
      displayName: 'Fade In',
      group: 'Transition',
      type: 'boolean',
      default: false,
      plug: 'input'
    });

    ports.push({
      name: 'tr-timing',
      displayName: 'Timing',
      group: 'Transition',
      type: 'curve',
      plug: 'input'
    });

    return ports;
  }
}

module.exports = PopupTransition;

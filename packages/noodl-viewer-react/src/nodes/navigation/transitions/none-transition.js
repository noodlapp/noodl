const Transition = require('./transition');

class NoneTransition extends Transition {
  constructor(from, to, params) {
    super();

    this.from = from;
    this.to = to;

    this.timing = { dur: 0, delay: 0 };
  }

  update(t) {}

  forward(t) {}

  back(t) {}

  static ports() {
    return [];
  }
}

module.exports = NoneTransition;

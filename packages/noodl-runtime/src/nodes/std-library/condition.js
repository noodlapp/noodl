'use strict';

const ConditionNode = {
  name: 'Condition',
  docs: 'https://docs.noodl.net/nodes/utilities/logic/condition',
  category: 'Logic',
  initialize: function () {},
  getInspectInfo() {
    const condition = this.getInputValue('condition');
    let value;
    if (condition === undefined) {
      value = '[No input]';
    }
    value = condition;
    return [
      {
        type: 'value',
        value
      }
    ];
  },
  inputs: {
    condition: {
      type: 'boolean',
      displayName: 'Condition',
      group: 'General',
      set(value) {
        if (!this.isInputConnected('eval')) {
          // Evaluate right away
          this.scheduleEvaluate();
        }
      }
    },
    eval: {
      type: 'signal',
      displayName: 'Evaluate',
      group: 'Actions',
      valueChangedToTrue() {
        this.scheduleEvaluate();
      }
    }
  },
  outputs: {
    ontrue: {
      type: 'signal',
      displayName: 'On True',
      group: 'Events'
    },
    onfalse: {
      type: 'signal',
      displayName: 'On False',
      group: 'Events'
    },
    result: {
      type: 'boolean',
      displayName: 'Is True',
      group: 'Booleans',
      get() {
        return !!this.getInputValue('condition');
      }
    },
    isfalse: {
      type: 'boolean',
      displayName: 'Is False',
      group: 'Booleans',
      get() {
        return !this.getInputValue('condition');
      }
    }
  },
  methods: {
    scheduleEvaluate() {
      this.scheduleAfterInputsHaveUpdated(() => {
        this.flagOutputDirty('result');
        this.flagOutputDirty('isfalse');

        const condition = this.getInputValue('condition');
        this.sendSignalOnOutput(condition ? 'ontrue' : 'onfalse');
      });
    }
  }
};

module.exports = {
  node: ConditionNode
};

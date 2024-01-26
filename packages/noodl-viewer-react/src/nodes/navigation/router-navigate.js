const { RouterHandler } = require('./router-handler');

const RouterNavigate = {
  name: 'RouterNavigate',
  displayNodeName: 'Navigate',
  category: 'Navigation',
  docs: 'https://docs.noodl.net/nodes/navigation/navigate',
  initialize: function () {
    this._internal.pageParams = {};
    this._internal.openInNewTab = false;
  },
  inputs: {
    navigate: {
      displayName: 'Navigate',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleNavigate();
      }
    },
    openInNewTab: {
      index: 10,
      displayName: 'Open in new tab',
      group: 'General',
      default: false,
      type: 'boolean',
      set(value) {
        this._internal.openInNewTab = !!value;
      }
    }
  },
  outputs: {
    navigated: {
      type: 'signal',
      displayName: 'Navigated',
      group: 'Events'
    }
  },
  methods: {
    scheduleNavigate: function () {
      var internal = this._internal;
      if (!internal.hasScheduledNavigate) {
        internal.hasScheduledNavigate = true;
        this.scheduleAfterInputsHaveUpdated(() => {
          internal.hasScheduledNavigate = false;
          this.navigate();
        });
      }
    },
    navigate() {
      RouterHandler.instance.navigate(this._internal.router, {
        target: this._internal.target,
        params: this._internal.pageParams,
        openInNewTab: this._internal.openInNewTab,
        hasNavigated: () => {
          this.scheduleAfterInputsHaveUpdated(() => {
            this.sendSignalOnOutput('navigated');
          });
        }
      });
    },
    setPageParam: function (param, value) {
      this._internal.pageParams[param] = value;
    },
    setTargetPage: function (page) {
      this._internal.target = page;
    },
    setRouter: function (value) {
      this._internal.router = value;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'target') {
        return this.registerInput(name, {
          set: this.setTargetPage.bind(this)
        });
      } else if (name === 'router') {
        return this.registerInput(name, {
          set: this.setRouter.bind(this)
        });
      } else if (name.startsWith('pm-')) {
        return this.registerInput(name, {
          set: this.setPageParam.bind(this, name.substring('pm-'.length))
        });
      }
    }
  }
};

module.exports = {
  node: RouterNavigate
};

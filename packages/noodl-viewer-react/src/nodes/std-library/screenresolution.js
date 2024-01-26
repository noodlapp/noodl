'use strict';

const ScreenResolution = {
  name: 'Screen Resolution',
  docs: 'https://docs.noodl.net/nodes/utilities/screen-resolution',
  category: 'Utilities',
  initialize() {
    // Add SSR Support
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', () => {
      this._viewportSizeChanged();
    });
    this._viewportSizeChanged();
  },
  getInspectInfo() {
    return this._internal.width + ' x ' + this._internal.height;
  },
  outputs: {
    width: {
      type: 'number',
      displayName: 'Width',
      get() {
        return this._internal.width;
      }
    },
    height: {
      type: 'number',
      displayName: 'Height',
      get() {
        return this._internal.height;
      }
    },
    aspectRatio: {
      type: 'number',
      displayName: 'Aspect Ratio',
      get() {
        return this._internal.width / this._internal.height;
      }
    }
  },
  methods: {
    _viewportSizeChanged() {
      this._internal.width = window.innerWidth;
      this._internal.height = window.innerHeight;
      this.flagAllOutputsDirty();
    }
  }
};

module.exports = {
  node: ScreenResolution
};

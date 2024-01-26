const _refCount = new Map(); //node id to ref count

const CSSDefinition = {
  name: 'CSS Definition',
  docs: 'https://docs.noodl.net/nodes/utilities/css-definition',
  category: 'CustomCode',
  color: 'javascript',
  nodeDoubleClickAction: {
    focusPort: 'Style'
  },
  initialize: function () {
    var internal = this._internal;
    internal.style = '';

    const styleId = this.getStyleRefId();

    this.addDeleteListener(() => {
      _refCount.set(styleId, _refCount.get(styleId) - 1);
      if (_refCount.get(styleId) === 0) {
        this.removeStyleDeclaration();
        _refCount.delete(styleId);
      }
    });

    if (!_refCount.has(styleId)) {
      _refCount.set(styleId, 0);
    }

    _refCount.set(styleId, _refCount.get(styleId) + 1);
  },
  inputs: {
    style: {
      index: 4005,
      type: { name: 'string', allowEditOnly: true, codeeditor: 'css' },
      displayName: 'Style',
      group: 'Content',
      default: '',

      set: function (value) {
        this.updateStyle(value);
      }
    }
  },
  outputs: {},
  methods: {
    getStyleRefId: function () {
      return 'style_' + this.id;
    },
    removeStyleDeclaration: function () {
      // Add SSR Support
      if (typeof document === 'undefined') return;

      var styleRefId = this.getStyleRefId();
      var styleObj = document.getElementById(styleRefId);
      if (styleObj !== null) {
        styleObj.parentNode.removeChild(styleObj);
      }
    },
    updateStyle: function (style) {
      // Add SSR Support
      if (typeof document === 'undefined') return;

      var internal = this._internal;
      var styleRefId = this.getStyleRefId();
      internal.style = style;

      if (style !== null) {
        var styleObj = document.getElementById(styleRefId);
        if (styleObj === null) {
          styleObj = document.createElement('style');
          styleObj.id = styleRefId;
          styleObj.type = 'text/css';
          document.head.appendChild(styleObj);
        }

        styleObj.innerHTML = '\n' + style + '\n';
      } else {
        this.removeStyleDeclaration();
      }
    }
  }
};

module.exports = {
  node: CSSDefinition
};

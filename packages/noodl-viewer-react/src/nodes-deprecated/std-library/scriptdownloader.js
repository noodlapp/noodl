'use strict';

const ScriptDownloadDefinition = {
  name: 'Script Downloader',
  docs: 'https://docs.noodl.net/nodes/javascript/script-downloader',
  shortDesc: 'Script Downloader allows you load external Javascript libraries. ',
  category: 'Javascript',
  color: 'javascript',
  deprecated: true,
  initialize: function () {
    var internal = this._internal;
    internal.loaded = false;
    internal.scripts = [];
    internal.loadedScripts = {};
    internal.startLoad = true;
  },
  inputs: {
    startLoad: {
      type: 'boolean',
      default: true,
      displayName: 'Load on start',
      group: 'General',
      set: function (value) {
        this._internal.startLoad = value;
      }
    },
    load: {
      displayName: 'Load',
      group: 'Actions',
      valueChangedToTrue: function () {
        this.scheduleUpdateScripts();
      }
    }
  },
  outputs: {
    loaded: {
      type: 'signal',
      displayName: 'Loaded'
    }
  },
  numberedInputs: {
    input: {
      displayPrefix: 'Script',
      group: 'External scripts',
      type: 'string',
      index: 3008,
      createSetter: function (index) {
        return function (value) {
          value = value.toString();
          this._internal.scripts[index] = value;

          if (!this._internal.loadStarted) {
            this._internal.loadStarted = true;
            this.scheduleAfterInputsHaveUpdated(function () {
              this._internal.loadStarted = false;

              if (!this._internal.startLoad) {
                return;
              }

              this.updateScripts();
            });
          }
        };
      }
    }
  },
  methods: {
    removeLoadTerminator: function () {
      var terminatorId = 'sentinel_' + this.id;
      var elem = document.getElementById(terminatorId);
      if (elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    },
    scheduleUpdateScripts: function () {
      const _this = this;

      if (!this._internal.updateScriptsScheduled) {
        this._internal.updateScriptsScheduled = true;
        this.scheduleAfterInputsHaveUpdated(function () {
          _this._internal.updateScriptsScheduled = false;

          _this.updateScripts();
        });
      }
    },
    updateScripts: function () {
      var terminatorId = 'sentinel_' + this.id;

      this.removeLoadTerminator();
      var scripts = this._internal.scripts;
      scripts = scripts.filter(function (script) {
        return script !== '';
      });

      var scriptElements = document.head.getElementsByTagName('script');
      var scriptsInHead = {};
      for (var i = 0; i < scriptElements.length; i++) {
        var script = scriptElements[i];
        if (script.src !== undefined && script.src !== '') {
          scriptsInHead[script.src] = script;
        }
      }

      for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i].trim();

        if (!this._internal.loadedScripts.hasOwnProperty(script)) {
          if (scriptsInHead.hasOwnProperty(script)) {
            continue;
          }

          var scriptObj = document.createElement('script');
          var _this = this;
          scriptObj.src = script;
          scriptObj.async = false;
          document.head.appendChild(scriptObj);
        }
      }

      var self = this;
      var onLoadedScript = document.createElement('script');
      onLoadedScript.onload = onLoadedScript.onreadystatechange = function (script) {
        if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
          self._internal.loaded = true;
          self.sendSignalOnOutput('loaded');
          self.removeLoadTerminator();
        }
      };

      // Since all scripts are downloaded synchronously, this will be loaded last and
      // signals that the others are done loading.
      onLoadedScript.id = terminatorId;
      onLoadedScript.src = 'load_terminator.js';
      onLoadedScript.async = false;
      document.head.appendChild(onLoadedScript);
    }
  }
};

module.exports = {
  node: ScriptDownloadDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }
  }
};

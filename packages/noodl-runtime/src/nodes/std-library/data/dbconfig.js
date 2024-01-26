'use strict';

const ConfigService = require('../../../api/configservice');

var ConfigNodeDefinition = {
  name: 'DbConfig',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/config',
  displayNodeName: 'Config',
  category: 'Cloud Services',
  usePortAsLabel: 'configKey',
  color: 'data',
  initialize: function () {
    var internal = this._internal;

    ConfigService.instance.getConfig().then((config) => {
      internal.config = config;
      if (this.hasOutput('value')) this.flagOutputDirty('value');
    });
  },
  getInspectInfo() {
    const value = this.getValue();

    if (value === undefined) return '[No Value]';

    return [{ type: 'value', value: value }];
  },
  inputs: {},
  outputs: {},
  methods: {
    getValue: function () {
      const internal = this._internal;
      if (internal.useDevValue && this.context.editorConnection && this.context.editorConnection.isRunningLocally()) {
        return internal.devValue;
      } else if (internal.config !== undefined && internal.configKey !== undefined) {
        return internal.config[internal.configKey];
      }
    },
    setInternal: function (key, value) {
      this._internal[key] = value;
      if (this.hasOutput('value')) this.flagOutputDirty('value');
    },
    registerOutputIfNeeded: function (name) {
      if (this.hasOutput(name)) {
        return;
      }

      if (name === 'value')
        return this.registerOutput(name, {
          getter: this.getValue.bind(this)
        });
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      if (name === 'configKey' || name === 'useDevValue' || name === 'devValue')
        return this.registerInput(name, {
          set: this.setInternal.bind(this, name)
        });
    }
  }
};

module.exports = {
  node: ConfigNodeDefinition,
  setup: function (context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function updatePorts(node) {
      var ports = [];

      context.editorConnection.clearWarning(node.component.name, node.id, 'dbconfig-warning');

      const configSchema = graphModel.getMetaData('dbConfigSchema');
      let valueType;

      if (configSchema) {
        const isCloud = typeof _noodl_cloud_runtime_version !== 'undefined';
        ports.push({
          name: 'configKey',
          displayName: 'Parameter',
          group: 'General',
          type: {
            name: 'enum',
            enums: Object.keys(configSchema)
              .filter((k) => isCloud || !configSchema[k].masterKeyOnly)
              .map((k) => ({ value: k, label: k })),
            allowEditOnly: true
          },
          plug: 'input'
        });

        if (node.parameters['configKey'] !== undefined && configSchema && configSchema[node.parameters['configKey']]) {
          valueType = configSchema[node.parameters['configKey']].type;

          if (
            valueType === 'string' ||
            valueType === 'boolean' ||
            valueType === 'number' ||
            valueType === 'object' ||
            valueType === 'array'
          ) {
            ports.push({
              name: 'useDevValue',
              displayName: 'Enable',
              group: 'Local Override',
              type: 'boolean',
              default: false,
              plug: 'input'
            });

            if (node.parameters['useDevValue'] === true) {
              ports.push({
                name: 'devValue',
                displayName: 'Value',
                group: 'Local Override',
                type: valueType,
                plug: 'input'
              });
            }
          }
        } else if (node.parameters['configKey'] !== undefined) {
          context.editorConnection.sendWarning(node.component.name, node.id, 'dbconfig-warning', {
            showGlobally: true,
            message: node.parameters['configKey'] + ' config parameter is missing, add it to your cloud service.'
          });
        }
      } else {
        context.editorConnection.sendWarning(node.component.name, node.id, 'dbconfig-warning', {
          showGlobally: true,
          message: 'You need an active cloud service.'
        });
      }

      ports.push({
        name: 'value',
        displayName: 'Value',
        group: 'General',
        type: valueType || '*',
        plug: 'output'
      });

      context.editorConnection.sendDynamicPorts(node.id, ports);
    }

    function _managePortsForNode(node) {
      updatePorts(node);

      node.on('parameterUpdated', function (event) {
        updatePorts(node);
      });

      graphModel.on('metadataChanged.dbConfigSchema', function (data) {
        ConfigService.instance.clearCache();
        updatePorts(node);
      });
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.DbConfig', function (node) {
        _managePortsForNode(node);
      });

      for (const node of graphModel.getNodesWithType('DbConfig')) {
        _managePortsForNode(node);
      }
    });
  }
};

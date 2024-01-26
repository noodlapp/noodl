'use strict';

function formatDynamicPorts(nodeMetadata) {
  const dynamicports = [];

  for (const dp of nodeMetadata.dynamicports) {
    if (dp.ports || dp.template || dp.port || dp.channelPort) {
      //same format as editor expects, no need to transform it
      dynamicports.push(dp);
    } else if (dp.inputs || dp.outputs) {
      //inputs and outputs is just list of names
      //need to pull the metadata from the inputs/outputs since they
      //won't be registered by the editor (it's either a regular port
      // or a dynamic port, can't register both)
      const ports = [];

      if (dp.inputs) {
        for (const inputName of dp.inputs) {
          ports.push(formatPort(inputName, nodeMetadata.inputs[inputName], 'input'));
        }
      }

      if (dp.outputs) {
        for (const outputName of dp.outputs) {
          ports.push(formatPort(outputName, nodeMetadata.outputs[outputName], 'output'));
        }
      }

      const dynamicPortGroup = {
        name: dp.name || 'conditionalports/basic',
        condition: dp.condition,
        ports
      };

      dynamicports.push(dynamicPortGroup);
    }
  }

  return dynamicports;
}

function formatPort(portName, portData, plugType) {
  var port = {
    name: portName,
    type: portData.type,
    plug: plugType
  };
  if (portData.group) {
    port.group = portData.group;
  }
  if (portData.displayName) {
    port.displayName = portData.displayName;
  }
  if (portData.description) {
    port.description = portData.description;
  }
  if (portData.editorName) {
    port.editorName = portData.editorName;
  }
  if (portData.default !== undefined) {
    port.default = portData.default;
  }
  if (portData.hasOwnProperty('index')) {
    port.index = portData.index;
  }
  if (portData.tooltip) {
    port.tooltip = portData.tooltip;
  }
  if (portData.tab) {
    port.tab = portData.tab;
  }
  if (portData.popout) {
    port.popout = portData.popout;
  }
  if (portData.allowVisualStates) {
    port.allowVisualStates = portData.allowVisualStates;
  }
  return port;
}

function generateNodeLibrary(nodeRegister) {
  var obj = {
    //note: needs to include ALL types
    typecasts: [
      {
        from: 'string',
        to: ['number', 'boolean', 'image', 'color', 'enum', 'textStyle', 'dimension', 'array', 'object']
      },
      {
        from: 'boolean',
        to: ['number', 'string', 'signal']
      },
      {
        from: 'number',
        to: ['boolean', 'string', 'dimension']
      },
      {
        from: 'date',
        to: ['string']
      },
      {
        from: 'signal',
        to: ['boolean', 'number']
      },
      {
        from: 'image',
        to: []
      },
      {
        from: 'cloudfile',
        to: ['string', 'image']
      },
      {
        from: 'color',
        to: []
      },
      {
        from: 'enum',
        to: []
      },
      {
        from: 'object',
        to: []
      },
      {
        from: 'domelement',
        to: []
      },
      {
        from: 'reference',
        to: []
      },
      {
        from: 'font',
        to: []
      },
      {
        from: 'textStyle',
        to: ['string']
      },
      {
        // Collection is deprecated but supported via typecasts
        from: 'collection',
        to: ['array']
      },
      {
        from: 'array',
        to: ['collection']
      }
    ],
    dynamicports: [
      {
        type: 'conditionalports',
        name: 'basic'
      },
      {
        type: 'expand',
        name: 'basic'
      }
    ],
    colors: {
      nodes: {
        component: {
          base: '#643D8B',
          baseHighlighted: '#79559b',
          header: '#4E2877',
          headerHighlighted: '#643d8b',
          outline: '#4E2877',
          outlineHighlighted: '#b58900',
          text: '#dbd0e4'
        },
        visual: {
          base: '#315272',
          baseHighlighted: '#4d6784',
          header: '#173E5D',
          headerHighlighted: '#315272',
          outline: '#173E5D',
          outlineHighlighted: '#b58900',
          text: '#cfd5de'
        },
        data: {
          base: '#465524',
          baseHighlighted: '#5b6a37',
          header: '#314110',
          headerHighlighted: '#465524',
          outline: '#314110',
          outlineHighlighted: '#b58900',
          text: '#d2d6c5'
        },
        javascript: {
          base: '#7E3660',
          baseHighlighted: '#944e74',
          header: '#67214B',
          headerHighlighted: '#7e3660',
          outline: '#67214B',
          outlineHighlighted: '#d57bab',
          text: '#e4cfd9'
        },
        default: {
          base: '#4C4F59',
          baseHighlighted: '#62656e',
          header: '#373B45',
          headerHighlighted: '#4c4f59',
          outline: '#373B45',
          outlineHighlighted: '#b58900',
          text: '#d3d4d6'
        }
      },
      connections: {
        signal: {
          normal: '#006f82',
          highlighted: '#7ec2cf',
          pulsing: '#ffffff'
        },
        default: {
          normal: '#875d00',
          highlighted: '#e5ae32',
          pulsing: '#ffffff'
        }
      }
    },
    nodetypes: [
      {
        name: 'Component Children',
        shortDesc: 'This node is a placeholder for where children of this component will be inserted.',
        docs: 'https://docs.noodl.net/nodes/component-utilities/component-children',
        color: 'component',
        allowAsChild: true,
        category: 'Visual',
        haveComponentChildren: ['Visual']
      }
    ]
  };

  var nodeTypes = Object.keys(nodeRegister._constructors);

  nodeTypes.forEach(function (type) {
    var nodeMetadata = nodeRegister._constructors[type].metadata;

    var nodeObj = {
      name: type,
      searchTags: nodeMetadata.searchTags
    };
    obj.nodetypes.push(nodeObj);

    if (nodeMetadata.version) {
      nodeObj.version = nodeMetadata.version;
    }
    if (nodeMetadata.displayNodeName) {
      nodeObj.displayNodeName = nodeMetadata.displayNodeName;
    }
    if (nodeMetadata.nodeDoubleClickAction) {
      nodeObj.nodeDoubleClickAction = nodeMetadata.nodeDoubleClickAction;
    }
    if (nodeMetadata.shortDesc) {
      nodeObj.shortDesc = nodeMetadata.shortDesc;
    }
    if (nodeMetadata.module) {
      nodeObj.module = nodeMetadata.module;
    }
    if (nodeMetadata.deprecated) {
      nodeObj.deprecated = true;
    }
    if (nodeMetadata.haveComponentPorts) {
      nodeObj.haveComponentPorts = true;
    }
    if (nodeMetadata.category === 'Visual') {
      nodeObj.allowAsChild = true;
      nodeObj.allowAsExportRoot = true;
      nodeObj.color = 'visual';
    }

    if (nodeMetadata.allowAsExportRoot !== undefined) {
      nodeObj.allowAsExportRoot = nodeMetadata.allowAsExportRoot;
    }

    if (nodeMetadata.allowChildren) {
      nodeObj.allowChildrenWithCategory = ['Visual'];
      nodeObj.color = 'visual';
    }
    if (nodeMetadata.allowChildrenWithCategory) {
      nodeObj.allowChildrenWithCategory = nodeMetadata.allowChildrenWithCategory;
    }
    if (nodeMetadata.singleton) {
      nodeObj.singleton = true;
    }
    if (nodeMetadata.allowAsChild) {
      nodeObj.allowAsChild = true;
    }
    if (nodeMetadata.docs) {
      nodeObj.docs = nodeMetadata.docs;
    }
    if (nodeMetadata.shortDocs) {
      nodeObj.shortDocs = nodeMetadata.shortDocs;
    } else if (nodeMetadata.docs && nodeMetadata.docs.indexOf('https://docs.noodl.net') === 0) {
      nodeObj.shortDocs = nodeMetadata.docs.replace('/#', '') + '-short.md';
    }
    nodeObj.category = nodeMetadata.category;

    if (nodeMetadata.panels) {
      nodeObj.panels = nodeMetadata.panels;
    }
    if (nodeMetadata.usePortAsLabel) {
      nodeObj.usePortAsLabel = nodeMetadata.usePortAsLabel;
      nodeObj.portLabelTruncationMode = nodeMetadata.portLabelTruncationMode;
    }
    if (nodeMetadata.color) {
      nodeObj.color = nodeMetadata.color;
    }
    if (nodeMetadata.dynamicports) {
      nodeObj.dynamicports = formatDynamicPorts(nodeMetadata);
    }
    if (nodeMetadata.exportDynamicPorts) {
      nodeObj.exportDynamicPorts = nodeMetadata.exportDynamicPorts;
    }
    if (nodeMetadata.visualStates) {
      nodeObj.visualStates = nodeMetadata.visualStates;
    }
    if (nodeMetadata.useVariants) {
      nodeObj.useVariants = nodeMetadata.useVariants;
    }
    if (nodeMetadata.connectionPanel) {
      nodeObj.connectionPanel = nodeMetadata.connectionPanel;
    }
    nodeObj.ports = [];

    var dynamicports = nodeObj.dynamicports || [];
    var selectorNames = {};
    var conditionalPortNames = {};

    //flag conditional ports so they don't get added from the normal ports, making them appear twice in the export
    /* dynamicports.filter(d=> d.name === 'conditionalports/basic')
            .forEach(d=> {
                d.ports.forEach(port=> {
                    conditionalPortNames[port.plug + '/' + port.name] = true;
                });
            });*/

    //same for channel ports
    dynamicports
      .filter((d) => d.channelPort !== undefined)
      .forEach((port) => {
        conditionalPortNames[port.channelPort.plug + '/' + port.channelPort.name] = true;
      });

    if (dynamicports.length) {
      nodeObj.dynamicports = dynamicports;
    }

    Object.keys(nodeMetadata.inputs).forEach(function (inputName) {
      if (
        selectorNames.hasOwnProperty('input/' + inputName) ||
        conditionalPortNames.hasOwnProperty('input/' + inputName)
      ) {
        //this is a selector or dynamic port. It's already been registered
        return;
      }
      var port = nodeMetadata.inputs[inputName];
      if (port.exportToEditor === false) {
        return;
      }

      nodeObj.ports.push(formatPort(inputName, port, 'input'));
    });

    function exportOutput(name, output) {
      var port = {
        name: name,
        type: output.type,
        plug: 'output'
      };
      if (output.group) {
        port.group = output.group;
      }
      if (output.displayName) {
        port.displayName = output.displayName;
      }
      if (output.editorName) {
        port.editorName = output.editorName;
      }
      if (output.hasOwnProperty('index')) {
        port.index = output.index;
      }
      nodeObj.ports.push(port);
    }

    Object.keys(nodeMetadata.outputs).forEach(function (prop) {
      if (selectorNames.hasOwnProperty('output/' + prop) || conditionalPortNames.hasOwnProperty('output/' + prop)) {
        //this is a selector or dynamic port. It's already been registered
        return;
      }

      var output = nodeMetadata.outputs[prop];
      exportOutput(prop, output);
    });
  });

  const coreNodes = [
    {
      name: 'UI Elements',
      description: 'Buttons, inputs, containers, media',
      type: 'visual',
      subCategories: [
        {
          name: 'Basic Elements',
          items: ['Group', 'net.noodl.visual.columns', 'Text', 'Image', 'Video', 'Circle', 'net.noodl.visual.icon']
        },
        {
          name: 'UI Controls',
          items: [
            'net.noodl.controls.button',
            'net.noodl.controls.checkbox',
            'net.noodl.controls.options',
            'net.noodl.controls.radiobutton',
            'Radio Button Group',
            'net.noodl.controls.range',
            'net.noodl.controls.textinput'
          ]
        }
      ]
    },
    {
      name: 'Navigation & Popups',
      description: 'Page routing, navigation, popups',
      type: 'logic',
      subCategories: [
        {
          name: 'Navigation',
          items: ['Router', 'RouterNavigate', 'PageInputs', 'net.noodl.externallink', 'PageStackNavigateToPath']
        },
        {
          name: 'Component Stack',
          items: ['Page Stack', 'PageStackNavigate', 'PageStackNavigateBack']
        },
        {
          name: 'Popups',
          items: ['NavigationShowPopup', 'NavigationClosePopup']
        }
      ]
    },
    {
      name: 'Logic & Utilities',
      description: 'Logic, events, string manipulation',
      type: 'logic',
      subCategories: [
        {
          name: 'General Utils',
          items: [
            'States',
            'Value Changed',
            'Timer',
            'Color Blend',
            'Number Remapper',
            'Counter',
            'Drag',
            'net.noodl.animatetovalue'
          ]
        },
        {
          name: 'Logic',
          items: ['Boolean To String', 'Switch', 'And', 'Or', 'Condition', 'Inverter']
        },
        {
          name: 'Events',
          items: ['Event Sender', 'Event Receiver']
        },
        {
          name: 'String Manipulation',
          items: ['Substring', 'String Mapper', 'String Format', 'Date To String', 'Unique Id']
        },
        {
          name: 'System',
          items: ['Screen Resolution', 'Open File Picker']
        },
        {
          name: 'Variables',
          items: ['String', 'Boolean', 'Color', 'Number']
        }
      ]
    },
    {
      name: 'Component Utilities',
      description: 'Component inputs, outputs & object',
      type: 'component',
      subCategories: [
        {
          name: '',
          items: [
            'Component Inputs',
            'Component Outputs',
            'Component Children',
            'net.noodl.ComponentObject',
            'net.noodl.ParentComponentObject',
            'net.noodl.SetComponentObjectProperties',
            'net.noodl.SetParentComponentObjectProperties'
          ]
        }
      ]
    },
    {
      name: 'Read & Write Data',
      description: 'Arrays, objects, cloud data',
      type: 'data',
      subCategories: [
        {
          name: '',
          items: [
            'RunTasks',
            'For Each',
            'For Each Actions',
            'Model2',
            'SetModelProperties',
            'NewModel',
            'Set Variable',
            'Variable2'
          ]
        },
        {
          name: 'Array',
          items: [
            'Collection2',
            'CollectionNew',
            'CollectionRemove',
            'CollectionClear',
            'CollectionInsert',
            'Filter Collection',
            'Map Collection',
            'Static Data'
          ]
        },
        {
          name: 'Cloud Data',
          items: [
            'DbModel2',
            'NewDbModelProperties',
            'FilterDBModels',
            'SetDbModelProperties',
            'DbCollection2',
            'DeleteDbModelProperties',
            'AddDbModelRelation',
            'RemoveDbModelRelation',
            'Cloud File',
            'Upload File',
            'CloudFunction2',
            'DbConfig'
          ]
        },
        {
          name: 'User',
          items: [
            'net.noodl.user.LogIn',
            'net.noodl.user.LogOut',
            'net.noodl.user.SignUp',
            'net.noodl.user.User',
            'net.noodl.user.SetUserProperties',
            'net.noodl.user.VerifyEmail',
            'net.noodl.user.SendEmailVerification',
            'net.noodl.user.ResetPassword',
            'net.noodl.user.RequestPasswordReset'
          ]
        },
        {
          name: 'External Data',
          items: ['REST2']
        }
      ]
    },
    {
      name: 'Custom Code',
      description: 'Custom JavaScript and CSS',
      type: 'javascript',
      subCategories: [
        {
          name: '',
          items: ['Expression', 'JavaScriptFunction', 'Javascript2', 'CSS Definition']
        }
      ]
    },
    {
      name: 'Cloud Functions',
      description: 'Nodes to be used in cloud functions',
      type: 'data',
      subCategories: [
        {
          name: '',
          items: ['noodl.cloud.request', 'noodl.cloud.response']
        },
        {
          name: 'Cloud Data',
          items: ['noodl.cloud.aggregate']
        }
      ]
    }
  ];

  obj.nodeIndex = {
    coreNodes
  };

  const moduleNodes = [];

  nodeTypes.forEach((type) => {
    const nodeMetadata = nodeRegister._constructors[type].metadata;
    if (nodeMetadata.module) {
      moduleNodes.push(type);
    }
  });

  if (moduleNodes.length) {
    obj.nodeIndex.moduleNodes = [
      {
        name: '',
        items: moduleNodes
      }
    ];
  }

  return obj;
}

module.exports = generateNodeLibrary;

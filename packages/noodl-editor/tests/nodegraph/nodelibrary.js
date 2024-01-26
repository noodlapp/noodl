function createTestNodeLibrary() {
  return {
    projectsettings: {
      dynamicports: [],
      ports: [
        {
          name: 'settingIgnoredInExport',
          type: 'string',
          ignoreInExport: true
        },
        {
          name: 'someSetting',
          type: 'string',
          ignoreInExport: false
        },
        {
          name: 'someSetting2',
          type: 'string'
        }
      ]
    },
    typecasts: [
      {
        from: 'boolean',
        to: []
      },
      {
        from: 'number',
        to: ['string', 'boolean']
      },
      {
        from: 'string',
        to: ['number', 'boolean', 'color']
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
      },
      {
        type: 'portchannel',
        name: 'event-sender-channel',
        channelPortname: 'channel',
        typename: 'Event Sender',
        ignorePorts: ['channel']
      },
      {
        type: 'numbered',
        name: 'basic-number',
        port: {
          type: 'number'
        }
      },
      {
        type: 'regexp',
        name: 'expression-js',
        filters: [
          {
            type: 'replace',
            comment: 'Removed javascript style comments',
            regexp: '((\\/\\/.*$)|(\\/\\*[\\s\\S]*?\\*\\/))',
            args: 'mg',
            with: ''
          },
          {
            type: 'replace',
            regexp: '"[^"]+"',
            args: 'g',
            with: ''
          },
          {
            type: 'replace',
            regexp: "'[^']+'",
            args: 'g',
            with: ''
          },
          {
            type: 'replace',
            regexp:
              '(break|case|class|catch|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield)',
            args: 'g',
            with: ''
          },
          {
            type: 'replace',
            regexp: '\\s',
            args: 'g',
            with: ''
          },
          {
            type: 'ignore',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*(?=\\()'
          },
          {
            type: 'ignore',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*(?=\\=)'
          },
          {
            type: 'ports',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*(?=\\:boolean)',
            args: 'g',
            port: {
              type: {
                name: 'boolean'
              },
              plug: 'input'
            }
          },
          {
            type: 'replace',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*\\:boolean',
            args: 'g'
          },
          {
            type: 'ports',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*(?=\\:string)',
            args: 'g',
            port: {
              type: {
                name: 'string'
              },
              plug: 'input'
            }
          },
          {
            type: 'replace',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*\\:string',
            args: 'g'
          },
          {
            type: 'ports',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*(?=\\:number)',
            args: 'g',
            port: {
              type: {
                name: 'number'
              },
              plug: 'input'
            }
          },
          {
            type: 'replace',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*\\:number',
            args: 'g'
          },
          {
            type: 'ports',
            regexp: '([a-z]|[A-Z])([a-z]|\\.|[A-Z]|[0-9])*',
            args: 'g',
            port: {
              type: {
                name: '=',
                default: 'string',
                allowedTypes: ['string', 'boolean', 'number']
              },
              plug: 'input'
            }
          }
        ]
      }
    ],
    nodetypes: [
      {
        name: 'Component Outputs',
        haveComponentPorts: true,
        color: 'component',
        ports: []
      },
      {
        name: 'Component Inputs',
        color: 'component',
        haveComponentPorts: true,
        ports: []
      },
      {
        name: 'Component Children',
        color: 'component',
        category: 'visuals',
        allowSingleInstanceOnly: true,
        haveComponentChildren: ['visuals']
      },
      {
        name: 'Component Modifier Children',
        color: 'component',
        category: 'modifiers',
        allowSingleInstanceOnly: true,
        haveComponentChildren: ['modifiers']
      },
      {
        name: 'group',
        version: 2,
        allowAsChild: true,
        allowAsExportRoot: true,
        category: 'visuals',
        allowChildrenWithCategory: ['visuals'],
        ports: [
          {
            name: 'compref',
            type: 'component',
            plug: 'input'
          },
          {
            group: 'test',
            name: 'x',
            type: {
              name: 'number',
              units: ['px', '%']
            },
            default: {
              value: 10,
              unit: '%'
            },
            plug: 'input'
          },
          {
            group: 'test',
            name: 'y',
            type: {
              name: 'number'
            },
            plug: 'input'
          },
          {
            name: 'opacity',
            type: 'number',
            plug: 'input'
          },
          {
            displayName: 'AlignX',
            name: 'alignX',
            type: {
              name: 'enum',
              enums: [
                {
                  value: 'left',
                  label: 'Left'
                },
                {
                  value: 'center',
                  label: 'Center'
                },
                {
                  value: 'right',
                  label: 'Right'
                }
              ]
            },
            plug: 'input'
          },
          {
            name: 'alignY',
            type: {
              name: 'string',
              enums: ['top', 'center', 'bottom']
            },
            plug: 'input'
          },
          {
            name: 'scaleX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'scaleY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'width',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'height',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'fill',
            type: {
              name: 'string',
              enums: ['parent', 'width', 'height', 'aspectFill', 'aspectFit']
            },
            plug: 'input'
          },
          {
            name: 'pivotX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'pivotY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'layoutX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'layoutY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'depth',
            type: {
              name: 'number',
              casts: ['boolean']
            },
            plug: 'input'
          },
          {
            name: 'rotationX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'rotationY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'rotationZ',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'touchPropagation',
            type: {
              name: 'boolean',
              casts: ['number']
            },
            plug: 'input'
          },
          {
            name: 'layout',
            type: {
              name: 'string',
              enums: ['stackVertical', 'stackHorizontal', 'flowVertical', 'flowHorizontal', 'none']
            },
            plug: 'input'
          },
          {
            name: 'clip',
            type: 'boolean',
            plug: 'input'
          },
          {
            group: 'test',
            name: 'screenX',
            type: 'number',
            plug: 'output'
          },
          {
            group: 'test',
            name: 'screenY',
            type: 'number',
            plug: 'output'
          },
          {
            name: 'width',
            type: 'number',
            plug: 'output'
          },
          {
            name: 'height',
            type: 'number',
            plug: 'output'
          },
          {
            name: 'this',
            type: 'reference',
            plug: 'output'
          },
          {
            name: 'clipOut',
            type: 'boolean',
            plug: 'output'
          }
        ]
      },
      {
        name: 'image',
        allowAsChild: true,
        allowAsExclusiveRootOnly: true,
        category: 'visuals',
        ports: [
          {
            name: 'x',
            type: {
              name: 'number'
            },
            plug: 'input'
          },
          {
            name: 'y',
            type: {
              name: 'number'
            },
            plug: 'input'
          },
          {
            name: 'opacity',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'alignX',
            type: {
              name: 'string',
              enums: ['left', 'center', 'right']
            },
            plug: 'input'
          },
          {
            name: 'alignY',
            type: {
              name: 'string',
              enums: ['top', 'center', 'bottom']
            },
            plug: 'input'
          },
          {
            name: 'scaleX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'scaleY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'width',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'height',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'fill',
            type: {
              name: 'string',
              enums: ['parent', 'width', 'height', 'aspectFill', 'aspectFit']
            },
            plug: 'input'
          },
          {
            name: 'pivotX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'pivotY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'layoutX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'layoutY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'depth',
            type: {
              name: 'number',
              casts: ['boolean']
            },
            plug: 'input'
          },
          {
            name: 'rotationX',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'rotationY',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'rotationZ',
            type: 'number',
            plug: 'input'
          },
          {
            name: 'touchPropagation',
            type: {
              name: 'boolean',
              casts: ['number']
            },
            plug: 'input'
          },
          {
            name: 'blendMode',
            type: {
              name: 'string',
              enums: ['normal', 'solid', 'additive', 'multiply']
            },
            plug: 'input'
          },
          {
            name: 'color',
            type: 'color',
            plug: 'input'
          },
          {
            name: 'image',
            type: {
              name: 'string'
            },
            allowEditOnly: true,
            plug: 'input/output'
          },
          {
            name: 'image2',
            type: {
              name: 'image'
            },
            plug: 'input'
          },
          {
            name: 'font',
            type: {
              name: 'font'
            },
            plug: 'input'
          },
          {
            name: 'css',
            type: {
              name: 'string',
              codeeditor: 'css'
            },
            allowEditOnly: true,
            plug: 'input'
          },
          {
            name: 'shader',
            type: 'shader',
            plug: 'input'
          },
          {
            group: 'gruppen',
            name: 'screenX',
            type: 'number',
            plug: 'output'
          },
          {
            name: 'screenY',
            type: 'number',
            plug: 'output'
          },
          {
            name: 'width',
            type: 'number',
            plug: 'output'
          },
          {
            name: 'height',
            type: 'number',
            plug: 'output'
          },
          {
            name: 'this',
            type: 'reference',
            plug: 'output'
          }
        ]
      },
      {
        name: 'animation'
      },
      {
        name: 'scaleModifier',
        category: 'modifiers'
      },
      {
        name: 'nodeWithNumberedPorts',
        dynamicports: [
          {
            name: 'numbered/basic-number',
            prefix: 'my number',
            displayPrefix: 'My number',
            port: {
              group: 'My group'
            }
          }
        ]
      },
      {
        name: 'nodeWithNumberedPortsAndSelectors',
        dynamicports: [
          {
            name: 'numbered/basic-number',
            prefix: 'my number',
            displayPrefix: 'My number',
            port: {
              group: 'My group'
            },
            selectors: [
              {
                name: 'startAt',
                displayName: 'Start at',
                group: 'My selectors'
              }
            ]
          }
        ]
      },
      {
        name: 'javascript expression',
        usePortAsLabel: 'expression',
        dynamicports: [
          {
            name: 'regexp/expression-js',
            port: 'expression'
          }
        ],
        ports: [
          {
            name: 'expression',
            type: {
              name: 'string',
              multiline: true
            },
            plug: 'input'
          },
          {
            name: 'result',
            type: '=',
            plug: 'output'
          }
        ]
      },

      {
        name: 'Event Sender',
        ports: [
          {
            name: 'channel',
            type: 'string',
            plug: 'input'
          }
        ]
      },

      {
        name: 'Event Receiver',
        dynamicports: [
          {
            name: 'portchannel/event-sender-channel',
            channelPort: {
              name: 'channel',
              displayName: 'Channel',
              plug: 'input'
            },
            port: {
              type: '*',
              plug: 'output'
            }
          }
        ]
      },

      {
        name: 'Anim',
        dynamicports: [
          {
            name: 'conditionalports/basic',
            condition: 'type = typeA',
            ports: [
              {
                name: 'from',
                plug: 'input',
                type: 'number'
              }
            ]
          },

          {
            name: 'conditionalports/basic',
            condition: 'type != typeA',
            ports: [
              {
                name: 'to',
                plug: 'input',
                type: 'number'
              }
            ]
          }
        ],
        ports: [
          {
            name: 'type',
            type: 'string',
            plug: 'input'
          }
        ]
      },

      {
        name: 'ExpandPorts',
        dynamicports: [
          {
            name: 'expand/basic',
            indexStep: 100,
            template: [
              {
                name: '{{portname}}.A',
                plug: 'input',
                type: 'number',
                index: 1
              }
            ]
          },
          {
            name: 'expand/basic',
            indexStep: 100,
            condition: "'{{portname}}.A' = test OR '{{portname}}.A' NOT SET",
            template: [
              {
                name: '{{portname}}.B',
                plug: 'input',
                type: 'number',
                index: 2
              }
            ]
          }
        ]
      }
    ]
  };
}

module.exports = createTestNodeLibrary();

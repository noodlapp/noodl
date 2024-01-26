const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const Exporter = require('@noodl-utils/exporter');
const { ProjectModel } = require('@noodl-models/projectmodel');

describe('export tests', function () {
  xit('can export ports on components', function () {
    ProjectModel.instance = ProjectModel.fromJSON(project1);
    NodeLibrary.instance.registerModule(ProjectModel.instance);

    ProjectModel.instance.setRootNode(ProjectModel.instance.findNodeWithId('Image-1'));

    const json = Exporter.exportToJSON(ProjectModel.instance);

    // Should not export types where the type has not been resolved
    expect(json.components[0].ports.length).toBe(2);
    expect(json.components[0].ports[0].name).toBe('out1');
    expect(json.components[0].ports[0].plug).toBe('output');
    expect(NodeLibrary.nameForPortType(json.components[0].ports[0].type)).toBe('string');
    expect(json.components[0].ports[1].name).toBe('out2');
    expect(json.components[0].ports[1].plug).toBe('output');
    expect(NodeLibrary.nameForPortType(json.components[0].ports[1].type)).toBe('number');

    NodeLibrary.instance.unregisterModule(ProjectModel.instance);
  });

  it('project settings are exported', function () {
    ProjectModel.instance = ProjectModel.fromJSON(project2);
    NodeLibrary.instance.registerModule(ProjectModel.instance);

    ProjectModel.instance.setRootNode(ProjectModel.instance.findNodeWithId('Group-1'));

    const json = Exporter.exportToJSON(ProjectModel.instance);
    expect(json.settings.canvasWidth).toBe(303);
    expect(json.settings.canvasHeight).toBe(404);

    NodeLibrary.instance.unregisterModule(ProjectModel.instance);
  });

  function matchBundle(bundle, componentIndex) {
    function arrayHasSameElements(a, b) {
      //check if equal but ignore order
      if (a.length !== b.length) return false;
      return a.every((e) => b.includes(e));
    }

    return Object.values(componentIndex).some((b) => arrayHasSameElements(bundle, b));
  }

  it('can export an index that includes pages and for each nodes', function () {
    ProjectModel.instance = ProjectModel.fromJSON({
      components: [
        {
          name: '/root',
          graph: {
            roots: [
              {
                id: 'nav-stack',
                type: 'Page Stack',
                parameters: {
                  pages: [
                    {
                      id: 'p1',
                      label: 'Page1'
                    },
                    {
                      id: 'p2',
                      label: 'Page2'
                    }
                  ],
                  'pageComp-p1': '/page1',
                  'pageComp-p2': '/page2'
                }
              },
              {
                id: 'n0',
                type: '/shared-comp'
              }
            ]
          }
        },
        {
          name: '/page1',
          graph: {
            roots: [
              {
                id: 'n0',
                type: '/shared-comp'
              }
            ]
          }
        },
        {
          name: '/page2',
          graph: {}
        },
        {
          name: '/shared-comp',
          graph: {}
        },
        {
          name: '/remaining-comp',
          graph: {}
        }
      ]
    });

    ProjectModel.instance.setRootNode(ProjectModel.instance.findNodeWithId('nav-stack'));

    const json = Exporter.exportToJSON(ProjectModel.instance);

    //make sure the root components are present directly in the export, not in a bundle
    expect(json.components.find((c) => c.name === '/root'));
    expect(json.components.find((c) => c.name === '/shared-comp'));

    //this test assume the bundles are emitted in a specific order
    //it makes the test tied to implementation specifics, so not great
    const bundles = {
      b2: {
        components: ['/page1'],
        dependencies: []
      },
      b3: {
        components: ['/page2'],
        dependencies: []
      },
      b4: {
        components: ['/remaining-comp'],
        dependencies: []
      }
    };

    expect(json.componentIndex).toEqual(bundles);
  });

  it('can follow For Each nodes when collecting dependencies', function () {
    ProjectModel.instance = ProjectModel.fromJSON({
      components: [
        {
          name: '/root',
          graph: {
            roots: [
              {
                id: 'node1',
                type: 'For Each',
                parameters: {
                  template: '/for-each-comp'
                }
              }
            ]
          }
        },
        {
          name: '/for-each-comp',
          graph: {}
        }
      ]
    });

    const allComponents = ProjectModel.instance.getComponents();
    const rootComponent = allComponents.find((c) => c.name === '/root');

    const graph = Exporter._collectDependencyGraph(rootComponent, allComponents);
    const deps = Exporter._flattenDependencyGraph(graph);

    expect(deps.length).toBe(2);
    expect(deps.find((c) => c.name === '/root'));
    expect(deps.find((c) => c.name === '/for-each-comp'));
  });

  it("creates bundles that doesn't have duplicates", function () {
    ProjectModel.instance = ProjectModel.fromJSON({
      components: [
        {
          name: '/comp1',
          graph: {
            roots: [
              {
                id: 'nav-stack',
                type: 'Page Stack',
                parameters: {
                  pages: [
                    {
                      id: 'p1',
                      label: 'Page1'
                    },
                    {
                      id: 'p2',
                      label: 'Page2'
                    }
                  ],
                  'pageComp-p1': '/page1',
                  'pageComp-p2': '/page2'
                }
              },
              {
                id: 'n0',
                type: '/shared-comp'
              }
            ]
          }
        },
        {
          name: '/page1',
          id: 'page1',
          graph: {
            roots: [
              {
                id: 'n1',
                type: '/shared-comp'
              },
              {
                id: 'n2',
                type: '/comp-used-on-both-pages'
              }
            ]
          }
        },
        {
          name: '/page2',
          id: 'page2',
          graph: {
            roots: [
              {
                id: 'n3',
                type: '/comp-used-on-both-pages'
              }
            ]
          }
        },
        {
          name: '/shared-comp',
          graph: {}
        },
        {
          name: '/comp-used-on-both-pages',
          graph: {}
        }
      ]
    });

    ProjectModel.instance.setRootNode(ProjectModel.instance.findNodeWithId('nav-stack'));

    const json = Exporter.exportToJSON(ProjectModel.instance);

    const componentCount = {};
    for (const name in json.componentIndex) {
      for (const comp of json.componentIndex[name].components) {
        if (componentCount[comp]) componentCount[comp]++;
        else componentCount[comp] = 1;
      }
    }

    for (const name in componentCount) {
      expect(componentCount[name]).toBe(1, 'Component ' + name + ' is in multiple bundles');
    }
  });

  it('calculated dependencies for bundles', function () {
    ProjectModel.instance = ProjectModel.fromJSON({
      components: [
        {
          name: '/comp1',
          graph: {
            roots: [
              {
                id: 'nav-stack',
                type: 'Page Stack',
                parameters: {
                  pages: [
                    {
                      id: 'p1',
                      label: 'Page1'
                    },
                    {
                      id: 'p2',
                      label: 'Page2'
                    }
                  ],
                  'pageComp-p1': '/page1',
                  'pageComp-p2': '/page2'
                }
              },
              {
                id: 'n0',
                type: '/shared-comp'
              }
            ]
          }
        },
        {
          name: '/page1',
          id: 'page1',
          graph: {
            roots: [
              {
                id: 'n1',
                type: '/shared-comp'
              },
              {
                id: 'n2',
                type: '/comp-used-on-both-pages'
              }
            ]
          }
        },
        {
          name: '/page2',
          id: 'page2',
          graph: {
            roots: [
              {
                id: 'n3',
                type: '/comp-used-on-both-pages'
              }
            ]
          }
        },
        {
          name: '/shared-comp',
          graph: {}
        },
        {
          name: '/comp-used-on-both-pages',
          graph: {}
        }
      ]
    });

    ProjectModel.instance.setRootNode(ProjectModel.instance.findNodeWithId('nav-stack'));

    const allComponents = ProjectModel.instance.getComponents();
    const rootComponent = allComponents.find((c) => c.name === '/comp1');

    const componentIndex = Exporter.getComponentIndex(rootComponent, allComponents);

    //this test assume the bundles are emitted in a specific order
    //it makes the test tied to implementation specifics, so not great
    const bundles = {
      b0: {
        components: ['/comp1'],
        dependencies: ['b1']
      },
      b1: {
        components: ['/shared-comp'],
        dependencies: []
      },
      b2: {
        components: ['/page1'],
        dependencies: ['b1', 'b3']
      },
      b3: {
        components: ['/comp-used-on-both-pages'],
        dependencies: []
      },
      b4: {
        components: ['/page2'],
        dependencies: ['b3']
      }
    };

    expect(componentIndex).toEqual(bundles);
  });

  xit('ignores project settings flagged to be excluded', function () {
    ProjectModel.instance = ProjectModel.fromJSON({
      components: [
        {
          name: '/comp2',
          graph: {
            roots: [
              {
                id: 'Group-1',
                type: 'group'
              }
            ]
          }
        }
      ],
      settings: {
        someSetting: 'test',
        someSetting2: 'test2',
        settingIgnoredInExport: 'test3'
      }
    });

    NodeLibrary.instance.registerModule(ProjectModel.instance);

    ProjectModel.instance.setRootNode(ProjectModel.instance.findNodeWithId('Group-1'));

    const json = Exporter.exportToJSON(ProjectModel.instance);
    expect(json.settings.someSetting).toBe('test');
    expect(json.settings.someSetting2).toBe('test2');
    expect(json.settings.settingIgnoredInExport).toBe(undefined);
    NodeLibrary.instance.unregisterModule(ProjectModel.instance);
  });

  var project1 = {
    components: [
      {
        name: '/comp1',
        graph: {
          roots: [
            {
              id: 'Image-1',
              type: 'image',
              parameters: {
                image: 'pic1.png',
                css: '%%%mycss {background:#ff00ff;}'
              }
            },
            {
              id: 'Comp-2',
              type: '/comp2'
            },
            {
              id: 'CO-1',
              type: 'Component Outputs',
              ports: [
                {
                  name: 'out1',
                  type: '*',
                  plug: 'input'
                },
                {
                  name: 'out2',
                  type: '*',
                  plug: 'input'
                }
              ]
            }
          ],
          connections: [
            {
              fromId: 'Image-1',
              fromProperty: 'image',
              toId: 'CO-1',
              toProperty: 'out1'
            },
            {
              fromId: 'Image-1',
              fromProperty: 'screenX',
              toId: 'CO-1',
              toProperty: 'out2'
            }
          ]
        }
      },

      // Should be excluded
      {
        name: '/comp3',
        graph: {
          roots: [
            {
              id: 'Image-3',
              type: 'image'
            }
          ]
        }
      },

      {
        name: '/comp2',
        graph: {
          roots: [
            {
              id: 'Image-2',
              type: 'image'
            }
          ]
        }
      }
    ]
  };

  // Second project for cross project reference
  var project2 = {
    components: [
      {
        name: '/comp2',
        graph: {
          roots: [
            {
              id: 'Group-1',
              type: 'group'
            }
          ]
        }
      }
    ],
    settings: {
      canvasWidth: 303,
      canvasHeight: 404
    }
  };
});

const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const BasicNodeType = require('@noodl-models/nodelibrary/BasicNodeType').BasicNodeType;
const UnknownNodeType = require('@noodl-models/nodelibrary/UnknownNodeType').UnknownNodeType;

const { ComponentModel } = require('@noodl-models/componentmodel');
const { ProjectModel } = require('@noodl-models/projectmodel');

describe('Node library tests', function () {
  beforeEach(() => {
    //reload fresh library for every test
    window.NodeLibraryData = require('../nodegraph/nodelibrary');
    for (const module of NodeLibrary.instance.modules) {
      NodeLibrary.instance.unregisterModule(module);
    }

    NodeLibrary.instance.loadLibrary();
  });

  it('can detect compatibale port types', function () {
    // Equal types
    expect(NodeLibrary.instance.canCastPortTypes('string', 'string')).toBe(true);
    expect(
      NodeLibrary.instance.canCastPortTypes(
        {
          name: 'string'
        },
        'string'
      )
    ).toBe(true);
    expect(
      NodeLibrary.instance.canCastPortTypes('string', {
        name: 'string'
      })
    ).toBe(true);

    // Not equal and cannot cast
    expect(
      NodeLibrary.instance.canCastPortTypes('string', {
        name: 'signal'
      })
    ).toBe(false);

    // Star types are compatible with everything
    expect(
      NodeLibrary.instance.canCastPortTypes('*', {
        name: 'number'
      })
    ).toBe(true);

    // Casting
    expect(
      NodeLibrary.instance.canCastPortTypes('number', {
        name: 'string'
      })
    ).toBe(true);
  });

  it('can find compatible port types', function () {
    // Single type
    expect(
      NodeLibrary.instance.findCompatiblePortType([
        {
          direction: 'to',
          type: 'string'
        }
      ])
    ).toEqual({
      name: 'string'
    });

    // Multiple connections, same type, with modifiers
    expect(
      NodeLibrary.instance.findCompatiblePortType([
        {
          direction: 'to',
          type: 'string'
        },
        {
          direction: 'from',
          type: {
            name: 'string',
            multiline: true
          }
        }
      ])
    ).toEqual({
      name: 'string',
      multiline: true
    });

    // Is enums merged
    expect(
      NodeLibrary.instance.findCompatiblePortType([
        {
          direction: 'to',
          type: {
            name: 'enum',
            enums: ['a', 'b']
          }
        },
        {
          direction: 'from',
          type: {
            name: 'enum',
            enums: ['b', 'c']
          }
        }
      ])
    ).toEqual({
      name: 'enum',
      enums: ['a', 'b', 'c']
    });

    // Find compatible type and merge
    expect(
      NodeLibrary.instance.findCompatiblePortType([
        {
          direction: 'to',
          type: {
            name: 'number',
            allowConnectionsOnly: true
          }
        },
        {
          direction: 'to',
          type: 'boolean'
        }
      ])
    ).toEqual({
      name: 'number',
      allowConnectionsOnly: true
    });

    // Find compatible type, mixed direction
    expect(
      NodeLibrary.instance.findCompatiblePortType([
        {
          direction: 'to',
          type: {
            name: 'number',
            allowEditOnly: true
          }
        },
        {
          direction: 'to',
          type: 'boolean'
        },
        {
          direction: 'from',
          type: 'number'
        }
      ])
    ).toEqual({
      name: 'number',
      allowEditOnly: true
    });

    // Find compatible type, mixed direction
    expect(
      NodeLibrary.instance.findCompatiblePortType([
        {
          direction: 'to',
          type: {
            name: 'number'
          }
        },
        {
          direction: 'to',
          type: 'boolean'
        },
        {
          direction: 'from',
          type: 'number'
        },
        {
          direction: 'to',
          type: 'color'
        }
      ])
    ).toEqual({
      name: 'string'
    });

    // Can't find compatible type
    expect(
      NodeLibrary.instance.findCompatiblePortType([
        {
          direction: 'to',
          type: {
            name: 'number',
            allowEditOnly: true
          }
        },
        {
          direction: 'to',
          type: 'boolean'
        },
        {
          direction: 'from',
          type: 'number'
        },
        {
          direction: 'to',
          type: 'referece'
        }
      ])
    ).toBe(undefined);
  });

  it('can reload library', function () {
    var p = ProjectModel.fromJSON(getProject());
    NodeLibrary.instance.registerModule(p);

    var n1 = p.components[0].graph.findNodeWithId('A');
    var n2 = p.components[0].graph.findNodeWithId('B');
    var n3 = p.components[0].graph.findNodeWithId('C');
    var n4 = p.components[0].graph.findNodeWithId('D');

    expect(n1.type instanceof BasicNodeType).toBe(true);
    expect(n1.type.name).toBe('image');
    expect(n2.type instanceof UnknownNodeType).toBe(true);

    // Update library
    NodeLibraryData.nodetypes.push({
      name: 'newimage',
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
        }
      ]
    });
    NodeLibrary.instance.reload();

    // Both should be OK now
    expect(n1.type instanceof BasicNodeType).toBe(true);
    expect(n1.type.name).toBe('image');

    expect(n2.type instanceof BasicNodeType).toBe(true);
    expect(n2.type.name).toBe('newimage');

    NodeLibrary.instance.unregisterModule(p);
  });

  it('can get types by name', () => {
    expect(NodeLibrary.instance.getNodeTypeWithName('comp1')).toBeUndefined();
    //get basic type from node library
    expect(NodeLibrary.instance.getNodeTypeWithName('image')).toBeInstanceOf(BasicNodeType);

    //get component type from a project
    const p = ProjectModel.fromJSON(getProject());
    NodeLibrary.instance.registerModule(p);
    expect(NodeLibrary.instance.getNodeTypeWithName('comp1')).toBeInstanceOf(ComponentModel);

    //add a new component and get the type
    const newComponent = ComponentModel.fromJSON({
      name: 'comp2',
      graph: {
        roots: [
          {
            id: 'B',
            type: 'image'
          }
        ]
      }
    });
    p.addComponent(newComponent);
    expect(NodeLibrary.instance.getNodeTypeWithName('comp2')).toBe(newComponent);

    //remove the component again
    p.removeComponent(newComponent);
    expect(NodeLibrary.instance.getNodeTypeWithName('comp2')).toBeUndefined();

    //unregister project and make sure the components aren't available anymore
    NodeLibrary.instance.unregisterModule(p);
    expect(NodeLibrary.instance.getNodeTypeWithName('comp1')).toBeUndefined();
    expect(NodeLibrary.instance.getNodeTypeWithName('comp2')).toBeUndefined();
  });

  function getProject() {
    return {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                id: 'A',
                type: 'image'
              },
              {
                id: 'B',
                type: 'newimage'
              },
              {
                id: 'C',
                type: 'Event Sender',
                parameters: {
                  channel: 'Channel0'
                }
              },
              {
                id: 'D',
                type: 'Event Receiver'
              }
            ]
          }
        }
      ]
    };
  }
});

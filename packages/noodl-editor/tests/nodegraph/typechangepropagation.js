const { ProjectModel } = require('@noodl-models/projectmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const { ComponentModel } = require('@noodl-models/componentmodel');

describe('Type change propagation', function () {
  var p;

  it('can load project', function () {
    p = ProjectModel.fromJSON(project1);
    NodeLibrary.instance.registerModule(p);
    expect(p).not.toBe(undefined);
  });

  xit('can remove connections and type will propagate', function () {
    // Remove connections
    var comp2 = p.getComponentWithName('/comp2');
    comp2.graph.removeConnection(comp2.graph.connections[0]);
    comp2.graph.removeConnection(comp2.graph.connections[0]);

    // Component types should now have propagated and been set to undefined
    var comp1 = p.getComponentWithName('/comp1');
    expect(NodeLibrary.nameForPortType(comp1.findPortWithName('in1').type)).toBe(undefined);
    expect(NodeLibrary.nameForPortType(comp1.findPortWithName('out2').type)).toBe(undefined);
  });

  xit('can reconnect and type will propagate', function () {
    // Add connections
    var comp2 = p.getComponentWithName('/comp2');
    var comp1 = p.getComponentWithName('/comp1');

    comp2.graph.addConnection({
      fromId: 'a05abb49-625e-8bd6-7183-7ea07a46e1d4',
      fromProperty: 'screenX',
      toId: '6783bee9-1225-5840-354f-348a3d270b6d',
      toProperty: 'out2'
    });
    comp2.graph.addConnection({
      fromId: 'b1a816da-5023-18a2-59ba-9c58be5cd073',
      fromProperty: 'in1',
      toId: 'a05abb49-625e-8bd6-7183-7ea07a46e1d4',
      toProperty: 'image'
    });

    // The types should have propagetd to comp1
    expect(NodeLibrary.nameForPortType(comp1.findPortWithName('in1').type)).toBe('string');
    expect(NodeLibrary.nameForPortType(comp1.findPortWithName('out2').type)).toBe('number');
  });

  xit('removing a type results in undefined type', function () {
    var n1 = p.getComponentWithName('/comp').graph.findNodeWithId('A');
    p.getComponentWithName('/comp').graph.evaluateHealth();

    expect(n1.getHealth().healthy).toBe(false);
    expect(n1.type.localName).toBe('notfound');
    expect(n1.type.fullName).toBe('/notfound');

    p.addComponent(
      ComponentModel.fromJSON({
        name: '/notfound',
        graph: {}
      })
    );
    p.getComponentWithName('/comp').graph.evaluateHealth();

    expect(n1.getHealth().healthy).toBe(true); // Node type should now be found
  });

  xit('can remove type and create new one with new name', function () {
    var n1 = p.getComponentWithName('/comp').graph.findNodeWithId('A');

    var comp = p.getComponentWithName('/notfound');
    p.removeComponent(comp);
    p.getComponentWithName('/comp').graph.evaluateHealth();

    expect(n1.getHealth().healthy).toBe(false); // Health should be bad again
    var comp2 = ComponentModel.fromJSON({
      name: '/notfound',
      graph: {}
    });

    p.addComponent(comp2);
    p.getComponentWithName('/comp').graph.evaluateHealth();
    expect(n1.getHealth().healthy).toBe(true); // The new type should be resolved
    expect(n1.type).toBe(comp2);
    expect(n1.toJSON().type).toBe('/notfound');
  });

  xit('can rename components, type is changed', function () {
    var n1 = p.getComponentWithName('/comp').graph.findNodeWithId('A');

    // rename the type
    p.renameComponentWithName('/notfound', '/notfound2');
    expect(n1.getHealth().healthy).toBe(true); // The new type should be resolved
    expect(n1.typename).toBe('/notfound2');
  });

  var project1 = {
    components: [
      {
        name: '/comp',
        graph: {
          roots: [
            {
              id: 'A',
              type: '/notfound'
            }
          ]
        }
      },
      {
        name: '/comp1',
        graph: {
          connections: [
            {
              fromId: '7f6b3382-b5c9-ae85-3614-3a3d0b31e4ce',
              fromProperty: 'out2',
              toId: 'd72cfb77-8515-8612-efed-c92e3f533b8b',
              toProperty: 'out2'
            },
            {
              fromId: '15a67805-e2ee-1fa4-b86a-4efc04e7028d',
              fromProperty: 'in1',
              toId: '7f6b3382-b5c9-ae85-3614-3a3d0b31e4ce',
              toProperty: 'in1'
            }
          ],
          roots: [
            {
              id: 'd72cfb77-8515-8612-efed-c92e3f533b8b',
              type: 'Component Outputs',
              x: 274,
              y: 185,
              parameters: {},
              children: [],
              ports: [
                {
                  name: 'out2',
                  type: '*',
                  plug: 'input'
                }
              ]
            },
            {
              id: '7f6b3382-b5c9-ae85-3614-3a3d0b31e4ce',
              type: '/comp2',
              x: 530,
              y: 185,
              parameters: {},
              children: []
            },
            {
              id: '15a67805-e2ee-1fa4-b86a-4efc04e7028d',
              type: 'Component Inputs',
              x: 792,
              y: 186,
              parameters: {},
              children: [],
              ports: [
                {
                  name: 'in1',
                  type: '*',
                  plug: 'output'
                }
              ]
            }
          ]
        }
      },
      {
        name: '/comp2',
        visual: true,
        visualRootId: 'a05abb49-625e-8bd6-7183-7ea07a46e1d4',
        canHaveVisualChildren: false,
        graph: {
          connections: [
            {
              fromId: 'a05abb49-625e-8bd6-7183-7ea07a46e1d4',
              fromProperty: 'this',
              toId: '6783bee9-1225-5840-354f-348a3d270b6d',
              toProperty: 'out2'
            },
            {
              fromId: 'b1a816da-5023-18a2-59ba-9c58be5cd073',
              fromProperty: 'in1',
              toId: 'a05abb49-625e-8bd6-7183-7ea07a46e1d4',
              toProperty: 'x'
            }
          ],
          roots: [
            {
              id: '6783bee9-1225-5840-354f-348a3d270b6d',
              type: 'Component Outputs',
              x: 686,
              y: 150,
              parameters: {},
              children: [],
              ports: [
                {
                  name: 'out2',
                  type: '*',
                  plug: 'input'
                }
              ]
            },
            {
              id: 'a05abb49-625e-8bd6-7183-7ea07a46e1d4',
              type: 'image',
              x: 426,
              y: 147,
              parameters: {},
              children: []
            },
            {
              id: 'b1a816da-5023-18a2-59ba-9c58be5cd073',
              type: 'Component Inputs',
              x: 169,
              y: 148,
              parameters: {},
              children: [],
              ports: [
                {
                  name: 'in1',
                  type: '*',
                  plug: 'output'
                }
              ]
            }
          ]
        }
      }
    ],
    name: 'proj1'
  };
});

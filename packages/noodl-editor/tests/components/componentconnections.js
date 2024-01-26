const NodeGraphModel = require('@noodl-models/nodegraphmodel').NodeGraphModel;
const NodeGraphNode = require('@noodl-models/nodegraphmodel').NodeGraphNode;
const { ComponentModel } = require('@noodl-models/componentmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const { ProjectModel } = require('@noodl-models/projectmodel');

describe('Connecting component inputs and outputs', function () {
  var g1, c1;
  var ci, co, n1, n2, co2;
  var p;
  var con1, con2;

  beforeEach(() => {
    window.NodeLibraryData = require('../nodegraph/nodelibrary');
    NodeLibrary.instance.loadLibrary();

    g1 = new NodeGraphModel();

    c1 = new ComponentModel({
      name: 'c1',
      graph: g1
    });

    ci = NodeGraphNode.fromJSON({
      type: 'Component Inputs',
      id: 'A'
    });
    g1.addRoot(ci);

    co = NodeGraphNode.fromJSON({
      type: 'Component Outputs',
      id: 'B'
    });
    g1.addRoot(co);

    co2 = NodeGraphNode.fromJSON({
      type: 'Component Outputs',
      id: 'B2'
    });
    g1.addRoot(co2);

    n1 = NodeGraphNode.fromJSON({
      type: 'group',
      id: 'C'
    });
    g1.addRoot(n1);

    n2 = NodeGraphNode.fromJSON({
      type: 'group',
      id: 'D'
    });
    g1.addRoot(n2);

    p = new ProjectModel({
      name: 'test'
    });
    p.addComponent(c1);

    NodeLibrary.instance.registerModule(p);
  });

  afterEach(() => {
    NodeLibrary.instance.unregisterModule(p);
  });

  function addPorts() {
    c1.graph.findNodeWithId('B').addPort({
      name: 'p1',
      plug: 'input',
      type: '*',
      index: 0
    });

    c1.graph.findNodeWithId('B').addPort({
      name: 'p2',
      plug: 'input',
      type: '*',
      index: 1
    });

    c1.graph.findNodeWithId('A').addPort({
      name: 'p3',
      plug: 'output',
      type: '*',
      index: 2
    });

    c1.graph.findNodeWithId('B2').addPort({
      name: 'p1',
      plug: 'input',
      type: '*',
      index: 0
    });
  }

  function addConnections() {
    con1 = {
      fromId: n1.id,
      fromProperty: 'width',
      toId: co.id,
      toProperty: 'p1'
    };
    g1.addConnection(con1);

    con2 = {
      fromId: ci.id,
      fromProperty: 'p3',
      toId: n1.id,
      toProperty: 'x'
    };
    g1.addConnection(con2);
  }

  // ------------------------------------------------------------------------------------------------------
  it('can add input ports to the component', function () {
    addPorts();

    var ports = c1.getPorts();
    expect(ports.length).toBe(3);
    expect(ports[0].name).toBe('p1');
    expect(ports[0].plug).toBe('output');
    expect(ports[0].type).toBe('*');
    expect(ports[1].name).toBe('p2');
    expect(ports[1].plug).toBe('output');
    expect(ports[1].type).toBe('*');
    expect(ports[2].name).toBe('p3');
    expect(ports[2].plug).toBe('input');
    expect(ports[2].type).toBe('*');
  });

  // ------------------------------------------------------------------------------------------------------
  it('can list ports correctly for component input/outputs', function () {
    addPorts();

    var ports = c1.graph.findNodeWithId('B').getPorts('input');

    expect(ports[0].name).toBe('p1');
    expect(ports[1].name).toBe('p2');
    expect(ports[0].plug).toBe('input');
    expect(ports[1].plug).toBe('input');
    expect(ports[0].type).toBe('*');
    expect(ports[1].type).toBe('*');
    expect(ports.length).toBe(2);

    var ports = c1.graph.findNodeWithId('A').getPorts('output');
    expect(ports[0].name).toBe('p3');
    expect(ports[0].plug).toBe('output');
    expect(ports[0].type).toBe('*');
    expect(ports.length).toBe(1);
  });

  // ------------------------------------------------------------------------------------------------------
  it('reports connection status properly', function () {
    addPorts();

    // component input
    var status = g1.getConnectionStatus({
      sourceNode: ci,
      sourcePort: 'p1',
      targetNode: n1,
      targetPort: 'width'
    });
    expect(status.connectable).toBe(true);

    // number to number
    var status = g1.getConnectionStatus({
      sourceNode: n1,
      sourcePort: 'screenX',
      targetNode: n2,
      targetPort: 'width'
    });
    expect(status.connectable).toBe(true);

    // component outputs
    var status = g1.getConnectionStatus({
      sourceNode: n1,
      sourcePort: 'width',
      targetNode: co,
      targetPort: 'p1'
    });
    expect(status.connectable).toBe(true);
  });

  // ------------------------------------------------------------------------------------------------------
  it('can rename ports', function () {
    addPorts();
    addConnections();

    expect(c1.graph.findNodeWithId('B').renamePortWithName('p1', 'p2')).toBe(false);
    expect(c1.graph.findNodeWithId('B').renamePortWithName('p1', 'p1b')).toBe(true);
    expect(c1.graph.findNodeWithId('A').renamePortWithName('p3', 'p3b')).toBe(true);

    expect(con2.fromProperty).toBe('p3b');
    expect(con1.toProperty).toBe('p1b');

    expect(c1.graph.findNodeWithId('B').renamePortWithName('p1b', 'p1')).toBe(true);
    expect(c1.graph.findNodeWithId('A').renamePortWithName('p3b', 'p3')).toBe(true);
  });

  // ------------------------------------------------------------------------------------------------------
  it('cannot remove ports with connections', function () {
    addPorts();
    addConnections();

    expect(c1.graph.findNodeWithId('B').removePortWithName('p1')).toBe(false);
    expect(c1.graph.findNodeWithId('B').removePortWithName('p2')).toBe(true);
    expect(c1.graph.findNodeWithId('A').removePortWithName('p3')).toBe(false);

    expect(c1.findPortWithName('p2')).toBe(undefined);
    expect(c1.findPortWithName('p1').name).toBe('p1');
  });

  // ------------------------------------------------------------------------------------------------------
  it('can add more connections are report type correctly', function () {
    addPorts();
    addConnections();

    g1.removeConnection(con1);
    g1.removeConnection(con2);

    // Single type, should just be number
    g1.addConnection({
      fromId: n1.id,
      fromProperty: 'screenX',
      toId: co2.id,
      toProperty: 'p1'
    });

    expect(NodeLibrary.nameForPortType(c1.findPortWithName('p1').type)).toBe('number');

    // Connect a number and boolean to the components outputs, but on different
    // nodes
    g1.addConnection({
      fromId: n1.id,
      fromProperty: 'clipOut',
      toId: co.id,
      toProperty: 'p1'
    });

    // Resulting type should be boolean (the only type that can be converted to from both boolean and number)
    expect(NodeLibrary.nameForPortType(c1.findPortWithName('p1').type)).toBe('boolean');

    // Adding a connection to a star type should not affect the resulting type
    g1.addConnection({
      fromId: ci.id,
      fromProperty: 'p3',
      toId: co2.id,
      toProperty: 'p1'
    });

    expect(NodeLibrary.nameForPortType(c1.findPortWithName('p1').type)).toBe('boolean');

    // Adding a reference type connection will cause it to break down, no type can be found
    g1.addConnection({
      fromId: n1.id,
      fromProperty: 'this',
      toId: co2.id,
      toProperty: 'p1'
    });

    expect(c1.findPortWithName('p1').type).toBe('*');
  });

  it('can report plug correctly', function () {
    addPorts();

    expect(c1.findPortWithName('p1').plug).toBe('output');
    expect(c1.findPortWithName('p3').plug).toBe('input');

    // Adding an extra port of mixed type for p1 should change the plug
    c1.graph.findNodeWithId('A').addPort({
      name: 'p1',
      plug: 'output',
      type: '*'
    });

    expect(c1.getPorts().length).toBe(4);
    expect(c1.getPorts()).toContain({
      name: 'p1',
      type: '*',
      default: undefined,
      group: undefined,
      plug: 'output',
      index: 0
    });
    expect(c1.getPorts()).toContain({
      name: 'p1',
      type: '*',
      default: undefined,
      group: undefined,
      plug: 'input',
      index: 1
    });
  });

  it('can ignore * types', function () {
    addPorts();
    addConnections();

    // Remove all connections
    while (g1.connections.length > 0) {
      g1.removeConnection(g1.connections[0]);
    }

    // Number type
    g1.addConnection({
      fromId: n1.id,
      fromProperty: 'screenX',
      toId: co.id,
      toProperty: 'p1'
    });

    expect(c1.findPortWithName('p1').type).toBe('number');

    // Add a connection to a * type
    g1.addConnection({
      fromId: ci.id,
      fromProperty: 'p3',
      toId: co.id,
      toProperty: 'p1'
    });

    // Should just ignore * type and still be number
    expect(c1.findPortWithName('p1').type).toBe('number');
  });

  it('can support units with default in types', function () {
    addPorts();
    addConnections();

    // Remove all connections
    while (g1.connections.length > 0) {
      g1.removeConnection(g1.connections[0]);
    }

    // Add a connection to a type with units
    g1.addConnection({
      fromId: ci.id,
      fromProperty: 'p3',
      toId: n1.id,
      toProperty: 'x'
    });

    // Should just ignore * type and still be number
    expect(c1.findPortWithName('p3').type.name).toBe('number');
    expect(c1.findPortWithName('p3').type.units).toEqual(['px', '%']);
    expect(c1.findPortWithName('p3').default).toEqual({
      value: 10,
      unit: '%'
    });

    expect(c1.findPortWithName('p3').group).toBe('test'); // Should inherit from connected port

    //Change parameter value should propagate to default
    n1.setParameter('x', {
      value: 50,
      unit: 'px'
    });
    expect(c1.findPortWithName('p3').default).toEqual({
      value: 50,
      unit: 'px'
    });
  });

  it('can rearrange ports', function () {
    addPorts();
    addConnections();

    ci.arrangePort('p3', undefined, 'G1');
    expect(c1.findPortWithName('p3').group).toBe('G1');
  });
});

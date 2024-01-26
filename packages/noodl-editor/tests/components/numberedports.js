const NodeGraphModel = require('@noodl-models/nodegraphmodel').NodeGraphModel;
const NodeGraphNode = require('@noodl-models/nodegraphmodel').NodeGraphNode;

describe('Numbered ports tests', function () {
  var g1, e1, e2, e3;

  beforeEach(() => {
    g1 = new NodeGraphModel();
    e1 = NodeGraphNode.fromJSON({
      id: 'A',
      type: 'nodeWithNumberedPorts'
    });

    g1.addRoot(e1);
  });

  xit('can add new ports dynamically', function () {
    var ports = e1.getPorts();
    expect(ports.length).toBe(1);
    expect(ports[0].name).toBe('my number 0');
    expect(ports[0].displayName).toBe('My number 0');
    expect(ports[0].type).toBe('number');
    expect(ports[0].group).toBe('My group');

    e1.setParameter('my number 0', 10);
    var ports = e1.getPorts();
    expect(ports.length).toBe(2);
    expect(ports[1].name).toBe('my number 1');
    expect(ports[1].displayName).toBe('My number 1');
  });

  xit('can find highest parameter', function () {
    // The number of parameters should be defined by the highest parameter that is
    // not undefined
    e1.setParameter('my number 1', 20);
    var ports = e1.getPorts();
    expect(ports.length).toBe(3);

    // Setting to undefined should still be there because 'my number 1' is 20
    e1.setParameter('my number 0', undefined);
    var ports = e1.getPorts();
    expect(ports.length).toBe(3);
  });

  xit('can detect connections', function () {
    e2 = NodeGraphNode.fromJSON({
      id: 'B',
      type: 'nodeWithNumberedPorts'
    });
    g1.addRoot(e2);

    g1.addConnection({
      fromId: 'A',
      fromProperty: 'my number 2',
      toId: 'B',
      toProperty: 'my number 1'
    });

    // A should now have 4 ports (connected to my number 2)
    var ports = e1.getPorts();
    expect(ports.length).toBe(4);

    // B should have 3 ports (connected to my number 1)
    var ports = e2.getPorts();
    expect(ports.length).toBe(3);
  });

  xit('can generate selectors', function () {
    e3 = NodeGraphNode.fromJSON({
      id: 'C',
      type: 'nodeWithNumberedPortsAndSelectors'
    });
    g1.addRoot(e3);

    var ports = e3.getPorts();
    expect(ports.length).toBe(2);
    expect(ports[1].name).toBe('startAt');
    expect(ports[1].group).toBe('My selectors');
    expect(ports[1].type.enums.length).toBe(0);
    expect(ports[1].type.name).toBe('enum');

    // Add a dynamic port, should be listed in the selector
    e3.setParameter('my number 0', 10);
    var ports = e3.getPorts();
    expect(ports.length).toBe(3);
    expect(ports[2].type.enums.length).toBe(1);
    expect(ports[2].type.enums[0].value).toBe('my number 0');
    expect(ports[2].type.enums[0].label).toBe('My number 0');

    // More
    e3.setParameter('my number 1', 20);
    var ports = e3.getPorts();
    expect(ports.length).toBe(4);
    expect(ports[3].type.enums.length).toBe(2);
    expect(ports[3].type.enums[0].value).toBe('my number 0');
    expect(ports[3].type.enums[0].label).toBe('My number 0');
    expect(ports[3].type.enums[1].value).toBe('my number 1');
    expect(ports[3].type.enums[1].label).toBe('My number 1');
  });
});

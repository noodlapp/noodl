const NodeGraphModel = require('@noodl-models/nodegraphmodel').NodeGraphModel;
const NodeGraphNode = require('@noodl-models/nodegraphmodel').NodeGraphNode;

describe('Node graph basic tests', function () {
  it('fires nodeAdded, nodeRemoved and connectionAdded, connectionRemoved events', function () {
    const g1 = new NodeGraphModel();

    var handlers = jasmine.createSpyObj('handlers', [
      'nodeAdded',
      'nodeRemoved',
      'connectionAdded',
      'connectionRemoved'
    ]);

    g1.on('nodeAdded', handlers.nodeAdded);
    g1.on('nodeRemoved', handlers.nodeRemoved);
    g1.on('connectionAdded', handlers.connectionAdded);
    g1.on('connectionRemoved', handlers.connectionRemoved);

    const n1 = NodeGraphNode.fromJSON({
      type: 'layer',
      id: 'A'
    });
    g1.addRoot(n1);

    expect(handlers.nodeAdded.calls.argsFor(0)[0].model).toBe(n1);

    const n2 = NodeGraphNode.fromJSON({
      type: 'layer',
      id: 'B'
    });
    g1.addRoot(n2);

    expect(handlers.nodeAdded.calls.argsFor(1)[0].model).toBe(n2);

    const con = {
      fromId: 'A',
      fromProperty: 'color',
      toId: 'B',
      toProperty: 'color'
    };
    g1.addConnection(con);
    expect(handlers.connectionAdded.calls.argsFor(0)[0].model).toBe(con);

    g1.removeConnection(con);
    expect(handlers.connectionRemoved.calls.argsFor(0)[0].model).toBe(con);

    g1.removeNode(n2);
    expect(handlers.nodeRemoved.calls.argsFor(0)[0].model).toBe(n2);
  });

  it('can change the id on all nodes', () => {
    const g1 = new NodeGraphModel();
    const n1 = NodeGraphNode.fromJSON({
      type: 'layer',
      id: 'A'
    });
    g1.addRoot(n1);
    const n2 = NodeGraphNode.fromJSON({
      type: 'layer',
      id: 'B'
    });
    g1.addRoot(n2);

    const con = {
      fromId: 'A',
      fromProperty: 'color',
      toId: 'B',
      toProperty: 'color'
    };
    g1.addConnection(con);

    g1.rekeyAllIds();

    expect(n1.id).not.toEqual('A');
    expect(n2.id).not.toEqual('B');
    expect(con.fromId).toEqual(n1.id);
    expect(con.toId).toEqual(n2.id);
  });

  describe('tracks what nodes are in the graph correctly', () => {
    it('can add and remove one node', () => {
      const graph = new NodeGraphModel();

      //add a root
      expect(graph.findNodeWithId('A')).toBeFalsy();
      const n1 = NodeGraphNode.fromJSON({
        type: 'test',
        id: 'A'
      });
      graph.addRoot(n1);
      expect(graph.findNodeWithId('A')).toBeTruthy();

      //and then remove it
      graph.removeNode(n1);
      expect(graph.findNodeWithId('A')).toBeFalsy();
    });

    it('can add and remove a node with children', () => {
      const graph = new NodeGraphModel();

      //add a new root with children and verify that both nodes are found
      const n2 = NodeGraphNode.fromJSON({
        type: 'test',
        id: 'A',
        children: [
          {
            type: 'test',
            id: 'B'
          }
        ]
      });
      graph.addRoot(n2);

      expect(graph.findNodeWithId('A')).toBe(n2);
      expect(graph.findNodeWithId('B')).toBe(n2.children[0]);

      //remove the root and verify that both nodes are removed
      graph.removeNode(n2);
      expect(graph.findNodeWithId('A')).toBeFalsy();
      expect(graph.findNodeWithId('B')).toBeFalsy();
    });

    it('can add a child node to a root', () => {
      const graph = new NodeGraphModel();

      const root = NodeGraphNode.fromJSON({
        type: 'test',
        id: 'A'
      });
      graph.addRoot(root);

      const child = NodeGraphNode.fromJSON({
        type: 'test',
        id: 'B'
      });

      root.addChild(child);

      expect(graph.findNodeWithId('A')).toBe(root);
      expect(graph.findNodeWithId('B')).toBe(child);

      const child2 = NodeGraphNode.fromJSON({
        type: 'test',
        id: 'C'
      });

      root.insertChild(child2, 0);

      expect(graph.findNodeWithId('C')).toBe(child2);
    });

    it('can remove a child node to a root', () => {
      const graph = new NodeGraphModel();

      const n2 = NodeGraphNode.fromJSON({
        type: 'test',
        id: 'A',
        children: [
          {
            type: 'test',
            id: 'B'
          }
        ]
      });
      graph.addRoot(n2);
      graph.removeNode(n2.children[0]);

      expect(graph.findNodeWithId('B')).toBeFalsy();
      expect(graph.findNodeWithId('A')).toBe(n2);
    });
  });
});

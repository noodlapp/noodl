const NodeGraphModel = require('@noodl-models/nodegraphmodel').NodeGraphModel;
const NodeGraphNode = require('@noodl-models/nodegraphmodel').NodeGraphNode;
const { ComponentModel } = require('@noodl-models/componentmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;

describe('Create status tests', function () {
  var g1, c1, c2;

  beforeEach(() => {
    window.NodeLibraryData = require('../nodegraph/nodelibrary');
    NodeLibrary.instance.loadLibrary();
  });

  it("can detect nodes that can't have/be children", function () {
    g1 = new NodeGraphModel();

    c1 = new ComponentModel({
      graph: g1,
      name: 'c1'
    });

    var n1 = NodeGraphNode.fromJSON(
      {
        type: 'group',
        id: 'A'
      },
      g1
    );
    g1.addRoot(n1);

    var n2 = NodeGraphNode.fromJSON(
      {
        type: 'animation',
        id: 'B'
      },
      g1
    );
    g1.addRoot(n2);

    var n3 = NodeGraphNode.fromJSON(
      {
        type: 'Component Children',
        id: 'C'
      },
      g1
    );
    g1.addRoot(n3);

    // Nodes that can have children
    var status = c1.getCreateStatus({
      parent: n1,
      type: NodeLibrary.instance.getNodeTypeWithName('group')
    });
    expect(status.creatable).toBe(true);

    // Animation nodes cannot be children
    var status = c1.getCreateStatus({
      parent: n1,
      type: NodeLibrary.instance.getNodeTypeWithName('animation')
    });
    expect(status.creatable).toBe(false);

    // Animation nodes cannot have children
    var status = c1.getCreateStatus({
      parent: n2,
      type: NodeLibrary.instance.getNodeTypeWithName('group')
    });
    expect(status.creatable).toBe(false);

    // Instance of itself
    var status = c1.getCreateStatus({
      type: c1
    });
    expect(status.creatable).toBe(false);
  });

  it('can detect circular references', function () {
    c1 = ComponentModel.fromJSON({
      name: 'comp1',
      graph: {}
    });
    c2 = ComponentModel.fromJSON({
      name: 'comp2',
      graph: {}
    });
    c1.graph.addRoot(
      NodeGraphNode.fromJSON(
        {
          type: c2,
          id: 'C'
        },
        c1.graph
      )
    );

    var status = c2.getCreateStatus({
      type: c1
    });
    expect(status.creatable).toBe(false);
  });
});

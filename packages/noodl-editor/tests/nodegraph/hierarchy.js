const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const NodeGraphNode = require('@noodl-models/nodegraphmodel').NodeGraphNode;
const { ComponentModel } = require('@noodl-models/componentmodel');

describe('Component instances', function () {
  var c;

  beforeEach(() => {
    window.NodeLibraryData = require('../nodegraph/nodelibrary');
    NodeLibrary.instance.loadLibrary();

    c = ComponentModel.fromJSON({
      name: 'test',
      graph: {
        roots: [
          {
            type: 'group',
            id: 'Group-1'
          }
        ]
      }
    });
  });

  it('can load component', function () {
    expect(c).not.toBe(undefined);
  });

  it('can detect children that can be attached', function () {
    const n1 = NodeGraphNode.fromJSON({
      type: 'image'
    });

    const n2 = NodeGraphNode.fromJSON({
      type: 'animation'
    });

    const n3 = NodeGraphNode.fromJSON({
      type: 'scaleModifier'
    });

    const n4 = NodeGraphNode.fromJSON({
      type: 'image'
    });

    // Can accept an image
    expect(c.graph.findNodeWithId('Group-1').canAcceptChildren([n1])).toBe(true);

    // Not all nodes can be children
    expect(c.graph.findNodeWithId('Group-1').canAcceptChildren([n1, n2])).toBe(false);

    // Not all nodes have accepted categories
    expect(c.graph.findNodeWithId('Group-1').canAcceptChildren([n1, n3])).toBe(false);

    // Multiple nodes with same category should be OK
    expect(c.graph.findNodeWithId('Group-1').canAcceptChildren([n1, n4])).toBe(true);
  });

  it('can report allow as child for components', function () {
    var c2 = ComponentModel.fromJSON({
      name: 'test',
      graph: {}
    });

    // No root nodes that can be children
    expect(c2.allowAsChild).toBe(false);

    c2.graph.addRoot(
      NodeGraphNode.fromJSON({
        type: 'group'
      })
    );

    // Group can be child
    expect(c2.allowAsChild).toBe(true);

    // Report correct category
    expect(c2.category).toBe('visuals');
  });

  it('can report accepted children for components', function () {
    expect(c.allowChildrenWithCategory).toBe(undefined);

    c.graph.addRoot(
      NodeGraphNode.fromJSON({
        type: 'Component Children'
      })
    );

    expect(c.allowChildrenWithCategory).toEqual(['visuals']);

    c.graph.addRoot(
      NodeGraphNode.fromJSON({
        type: 'Component Modifier Children'
      })
    );

    expect(c.allowChildrenWithCategory).toEqual(['modifiers', 'visuals']);
  });

  it('can detect allow export root', function () {
    var c2 = ComponentModel.fromJSON({
      name: 'test',
      graph: {}
    });

    expect(c2.allowAsExportRoot).toBe(false);

    c2.graph.addRoot(
      NodeGraphNode.fromJSON({
        type: 'group'
      })
    );

    expect(c2.allowAsExportRoot).toBe(true);
  });
});

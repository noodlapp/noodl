const NodeGraphNode = require('@noodl-models/nodegraphmodel').NodeGraphNode;
const NodeGraphEditor = require('@noodl-views/nodegrapheditor').NodeGraphEditor;
const { ProjectModel } = require('@noodl-models/projectmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const PopupLayer = require('@noodl-views/popuplayer');
const DebugInspector = require('@noodl-utils/debuginspector');
const ViewerConnection = require('../../src/editor/src/ViewerConnection');

describe('Node graph editor auto tests', function () {
  var c1, g1;

  // Records and store mouse calls to the node graph editor
  var storeTimeout;
  var recordedEvents = [];

  function storeEvents() {
    clearTimeout(storeTimeout);
    storeTimeout = setTimeout(function () {
      localStorage['recordedEvents'] = JSON.stringify(recordedEvents);
    }, 1000);
  }

  function recordEvents() {
    var types = ['mousedown', 'mousemove', 'mouseup'];

    // mouse
    var old = NodeGraphEditor.instance.mouse;
    NodeGraphEditor.instance.mouse = function (type, pos, evt) {
      var now = +new Date();
      recordedEvents.push({
        type: type,
        time: now,
        x: pos.x,
        y: pos.y,
        evt: evt
          ? {
              button: evt.button,
              shiftKey: evt.shiftKey ? true : undefined,
              ctrlKey: evt.ctrlKey ? true : undefined,
              spaceKey: evt.spaceKey ? true : undefined
            }
          : undefined
      });

      storeEvents();

      return old.call(this, type, pos, evt);
    };

    // cut, copy, paste
    var oldCut = NodeGraphEditor.instance.cut;
    NodeGraphEditor.instance.cut = function () {
      var now = +new Date();
      recordedEvents.push({
        type: 'cut',
        time: now
      });
      return oldCut.call(this);
    };

    var oldCopy = NodeGraphEditor.instance.copy;
    NodeGraphEditor.instance.copy = function () {
      var now = +new Date();
      recordedEvents.push({
        type: 'copy',
        time: now
      });
      return oldCopy.call(this);
    };

    var oldPaste = NodeGraphEditor.instance.paste;
    NodeGraphEditor.instance.paste = function () {
      var now = +new Date();
      recordedEvents.push({
        type: 'paste',
        time: now
      });
      return oldPaste.call(this);
    };
  }

  // Plays back previously stored mouse calls
  function playEvents(events, done, realtime) {
    var i = 0;

    function play() {
      var event = events[i];
      var type = event.type;
      if (type === 'cut') {
        NodeGraphEditor.instance.cut();
      } else if (type === 'copy') {
        NodeGraphEditor.instance.copy();
      } else if (type === 'paste') {
        NodeGraphEditor.instance.paste();
      } else {
        NodeGraphEditor.instance.mouse(
          event.type,
          {
            x: event.x,
            y: event.y
          },
          event.evt
        );
      }

      if (events[i + 1]) {
        setTimeout(function () {
          i++;
          play();
        }, events[i + 1].time - event.time);
      } else {
        done();
      }
    }

    play();
  }

  // Sets up a fresh node graph editor
  function setup() {
    $('body').append(
      '<div id="node-graph-editor" style="position:absolute; top:0px; right:0px; width:400px; height:800px; background-color:white;"></div>'
    );

    // Disable context menu
    $('body').on('contextmenu', function () {
      return false;
    });

    // NodeLibrary.instance = new NodeLibrary();

    ProjectModel.instance = ProjectModel.fromJSON(project);
    NodeLibrary.instance.registerModule(ProjectModel.instance);

    c1 = ProjectModel.instance.getComponentWithName('Root');
    g1 = c1.graph;

    // Mocking panel instance
    PopupLayer.instance = {
      showTooltip: function () {},
      hideTooltip: function () {},
      showToast: function () {},
      on: function () {},
      hidePopup: function () {},
      showPopup: function () {},
      isDragging: function () {
        return false;
      },
      showModal: function () {},
      hideModal: function () {},
      hideAllModalsAndPopups: function () {}
    };

    // Mocking viewer connection
    ViewerConnection.instance = {
      on: function () {},
      sendNodeHighlighted: function () {}
    };

    NodeGraphEditor.instance = new NodeGraphEditor({
      model: g1
    });
    NodeGraphEditor.instance.setPanAndScale({
      scale: 1,
      x: 0,
      y: 0
    });
    NodeGraphEditor.instance.render();
    $('#node-graph-editor').append(NodeGraphEditor.instance.el);
    NodeGraphEditor.instance.resize({
      x: 0,
      y: 0,
      width: 400,
      height: 800
    });
  }

  var project = {
    components: [
      {
        name: 'Root',
        ports: [],
        visual: true,
        visualRootId: '14e31556-f569-21bb-e948-65af515ae574',
        canHaveVisualChildren: false,
        graph: {
          connections: [],
          roots: []
        }
      }
    ]
  };

  function setupNodes() {
    g1.addRoot(
      NodeGraphNode.fromJSON({
        id: '14e31556-f569-21bb-e948-65af515ae574',
        type: 'group',
        label: 'group1',
        x: 49,
        y: 75
      })
    );

    g1.addRoot(
      NodeGraphNode.fromJSON({
        id: '33a2be5c-b341-27b4-292f-aee1b5bc30fe',
        type: 'group',
        label: 'group2',
        x: 49,
        y: 164
      })
    );

    g1.addRoot(
      NodeGraphNode.fromJSON({
        id: '34ea0053-3334-d2cb-3a31-de577030102e',
        type: 'group',
        label: 'group3',
        x: 49,
        y: 267
      })
    );
  }

  function setupNodes2() {
    g1.addRoot(
      NodeGraphNode.fromJSON({
        id: 'A',
        type: 'group',
        label: 'group4',
        x: 49,
        y: 367
      })
    );
  }

  function setupConnections() {
    g1.addConnection({
      fromId: '14e31556-f569-21bb-e948-65af515ae574',
      fromProperty: 'screenX',
      toId: '33a2be5c-b341-27b4-292f-aee1b5bc30fe',
      toProperty: 'x'
    });
  }

  function setupConnections2() {
    g1.addConnection({
      fromId: '34ea0053-3334-d2cb-3a31-de577030102e',
      fromProperty: 'screenX',
      toId: '33a2be5c-b341-27b4-292f-aee1b5bc30fe',
      toProperty: 'x'
    });

    g1.addConnection({
      fromId: '14e31556-f569-21bb-e948-65af515ae574',
      fromProperty: 'screenX',
      toId: '34ea0053-3334-d2cb-3a31-de577030102e',
      toProperty: 'y'
    });
  }

  function teardownNodes() {
    g1.removeAllNodes();
  }

  // Closes and tears the node graph editor down
  function teardown() {
    $('#node-graph-editor').remove();
    NodeGraphEditor.instance = undefined;
  }

  it('can setup view', function () {
    setup();
    expect(NodeGraphEditor.instance).not.toBe(undefined);
  });

  /* it('can record events',function(done) {
     setupNodes();
   //  setupNodes2();
     recordEvents();
   });
   return;*/

  // Multi re arrange
  xit('Multi rearrange nodes, attach, detach', function (done) {
    setupNodes();
    setupNodes2();

    playEvents(require('../recordings/multirearrange.json'), function () {
      expect(g1.roots.length).toBe(2);

      var n1 = g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574');
      var n2 = g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe');
      var n3 = g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e');
      var n4 = g1.findNodeWithId('A');

      expect(n1.children[0]).toBe(n3);
      expect(n4.children[0]).toBe(n2);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  xit('cut n paste', function (done) {
    setupNodes();

    playEvents(require('../recordings/cutnpaste.json'), function () {
      expect(g1.roots.length).toBe(3);
      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe')).not.toBe(undefined);
      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e')).not.toBe(undefined);
      expect(g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574')).not.toBe(undefined);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  xit('can undo attach, detach and move', function (done) {
    setupNodes();

    playEvents(require('../recordings/undoarrange.json'), function () {
      // group3
      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e').parent).toBe(undefined);

      // group2 child to group1
      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe').parent).toBe(
        g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574')
      );

      NodeGraphEditor.instance.undo(); // Undo detach

      // group3 child to group1
      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e').parent).toBe(
        g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574')
      );

      NodeGraphEditor.instance.undo(); // Undo attach

      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e').parent).toBe(undefined);
      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe').parent).toBe(undefined);

      NodeGraphEditor.instance.undo(); // Undo move

      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e').x).toBe(49);
      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e').y).toBe(267);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  // Single re arrange
  xit('single rearrange nodes, attach, detach', function (done) {
    setupNodes();

    playEvents(require('../recordings/singlerearrange.json'), function () {
      var n = g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574');
      expect(n.parent).toBe(undefined);

      var n1 = g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe');
      var n2 = g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e');

      expect(n1.parent).toBe(n);
      expect(n2.parent).toBe(n);

      expect(n.children[0]).toBe(n2);
      expect(n.children[1]).toBe(n1);

      expect(g1.roots.length).toBe(1);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  // Multi select and mode nodes
  xit('can multiselect and move nodes', function (done) {
    setupNodes();

    playEvents(require('../recordings/multimove.json'), function () {
      var n1 = NodeGraphEditor.instance.model.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574');
      var n2 = NodeGraphEditor.instance.model.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe');

      expect(n1.x).toBe(50);
      expect(n1.y).toBe(365);

      expect(n2.x).toBe(50);
      expect(n2.y).toBe(454);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  // Drag to move nodes
  xit('can move nodes', function (done) {
    setupNodes();

    playEvents(require('../recordings/movenode.json'), function () {
      var n = NodeGraphEditor.instance.model.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574');
      expect(n.x).toBe(47);
      expect(n.y).toBe(408);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  xit('can undo cut and paste', function (done) {
    setupNodes();

    playEvents(require('../recordings/undocutpaste.json'), function () {
      expect(g1.roots.length).toBe(3);
      expect(g1.roots[1].label).toBe('group2');
      expect(g1.roots[2].label).toBe('group3');
      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe')).toBe(undefined);
      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e')).toBe(undefined);

      NodeGraphEditor.instance.undo(); // Undo paste

      expect(g1.roots.length).toBe(1);

      NodeGraphEditor.instance.undo(); // Undo cut

      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe')).not.toBe(undefined);
      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e')).not.toBe(undefined);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  // Undo cut children
  xit('Can undo cut children', function (done) {
    setupNodes();
    setupNodes2();

    playEvents(require('../recordings/undocutchildren.json'), function () {
      expect(g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574').children[0]).toBe(g1.findNodeWithId('A'));

      NodeGraphEditor.instance.undo();

      expect(g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574').children[0]).toBe(
        g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe')
      );
      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe').children[0]).toBe(
        g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e')
      );

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  // Undo cut connections
  xit('Can undo cut connections', function (done) {
    setupNodes();
    setupConnections();
    setupConnections2();

    playEvents(require('../recordings/undocutconnections.json'), function () {
      expect(g1.connections.length).toBe(0);

      NodeGraphEditor.instance.undo();

      expect(g1.connections.length).toBe(3);

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();
      done();
    });
  });

  // Can delete and undo connection
  xit('can delete and undo delete connection', function (done) {
    setupNodes();
    setupConnections();

    playEvents(require('../recordings/deletecon.json'), function () {
      expect(g1.connections.length).toBe(0);
      NodeGraphEditor.instance.undo();
      expect(g1.connections.length).toBe(1);
      expect(g1.connections[0].fromId).toBe('14e31556-f569-21bb-e948-65af515ae574');

      expect(NodeGraphEditor.instance.verifyWithModel()).toBe(true);
      teardownNodes();

      done();
    });
  });

  // Delete
  xit('can delete nodes and undo', function (done) {
    setupNodes();
    setupConnections();

    playEvents(require('../recordings/deleteandundo.json'), function () {
      NodeGraphEditor.instance.delete();

      expect(g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574')).toBe(undefined);
      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe')).toBe(undefined);
      expect(g1.findNodeWithId('34ea0053-3334-d2cb-3a31-de577030102e')).not.toBe(undefined);
      expect(g1.connections.length).toBe(0);

      NodeGraphEditor.instance.undo();

      expect(g1.findNodeWithId('14e31556-f569-21bb-e948-65af515ae574')).not.toBe(undefined);
      expect(g1.findNodeWithId('33a2be5c-b341-27b4-292f-aee1b5bc30fe')).not.toBe(undefined);
      expect(g1.connections.length).toBe(1);
      teardownNodes();

      done();
    });
  });

  xit('Can create inspectors', function (done) {
    setupNodes();
    setupConnections();
    setupConnections2();

    playEvents(
      require('../recordings/connectiondebugger.json'),
      function () {
        var model = DebugInspector.InspectorsModel.instanceForProject(ProjectModel.instance);
        var inspectors = model.getInspectors();
        expect(inspectors[1]).toEqual({
          connectionKey: '14e31556-f569-21bb-e948-65af515ae574screenX33a2be5c-b341-27b4-292f-aee1b5bc30fex',
          pinned: true,
          position: 0.390625,
          type: 'connection',
          connection: {
            fromId: '14e31556-f569-21bb-e948-65af515ae574',
            fromProperty: 'screenX',
            toId: '33a2be5c-b341-27b4-292f-aee1b5bc30fe',
            toProperty: 'x'
          }
        });
        expect(inspectors[0]).toEqual({
          connectionKey: '34ea0053-3334-d2cb-3a31-de577030102escreenX33a2be5c-b341-27b4-292f-aee1b5bc30fex',
          pinned: true,
          position: 0.515625,
          type: 'connection',
          connection: {
            fromId: '34ea0053-3334-d2cb-3a31-de577030102e',
            fromProperty: 'screenX',
            toId: '33a2be5c-b341-27b4-292f-aee1b5bc30fe',
            toProperty: 'x'
          }
        });
        expect(inspectors.length).toBe(2);

        teardownNodes();
        done();
      },
      true
    ); // Play in real time
  });

  // Multi select and mode nodes
  it('can tear down', function () {
    teardown();
    expect(NodeGraphEditor.instance).toBe(undefined);
  });
});

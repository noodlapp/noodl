const { ComponentPorts } = require('@noodl-views/panels/componentports');
const { ProjectModel } = require('@noodl-models/projectmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const { UndoQueue } = require('@noodl-models/undo-queue-model');

describe('Components ports panel unit tests', function () {
  var cp, c;

  beforeEach(() => {
    var project = {
      components: [
        {
          name: 'Root',
          graph: {
            roots: [
              {
                type: 'Component Inputs',
                id: 'A'
              }
            ]
          }
        }
      ]
    };

    window.NodeLibraryData = require('../nodegraph/nodelibrary');
    NodeLibrary.instance.loadLibrary();

    ProjectModel.instance = ProjectModel.fromJSON(project);
    // NodeLibrary.instance.registerModule(project);

    c = ProjectModel.instance.getComponentWithName('Root');
    cp = new ComponentPorts({
      model: c.graph.findNodeWithId('A'),
      plug: 'input'
    });
    cp.render();

    cp.canArrangeInGroups = true; // Enable arrange in groups
  });

  afterEach(() => {
    ProjectModel.instance = undefined;
  });

  it('can add ports', function () {
    expect(cp.performAdd('test').success).toBe(true);
    expect(c.findPortWithName('test')).not.toBe(undefined);

    // Cannot create with same name
    expect(cp.performAdd('test').success).toBe(false);

    // Can add with different name
    expect(cp.performAdd('test2').success).toBe(true);
    expect(c.findPortWithName('test2')).not.toBe(undefined);
  });

  it('can undo add ports', function () {
    expect(cp.performAdd('undome').success).toBe(true);
    expect(c.findPortWithName('undome')).not.toBe(undefined);

    UndoQueue.instance.undo();

    expect(c.findPortWithName('undome')).toBe(undefined);
  });

  it('can rename+undo ports', function () {
    cp.performAdd('test');
    cp.performAdd('test2');

    // cannot rename to existing name
    expect(
      cp.performRename({
        oldName: 'test',
        newName: 'test2'
      }).success
    ).toBe(false);

    expect(
      cp.performRename({
        oldName: 'test',
        newName: 'test3'
      }).success
    ).toBe(true);
    expect(c.findPortWithName('test3')).not.toBe(undefined);
    expect(c.findPortWithName('test')).toBe(undefined);

    // Undo rename
    UndoQueue.instance.undo();

    expect(c.findPortWithName('test3')).toBe(undefined);
    expect(c.findPortWithName('test')).not.toBe(undefined);
  });

  it('can delete+undo ports', function () {
    cp.performAdd('test');
    cp.renderPorts(true);

    expect(cp.performDelete('test').success).toBe(true);
    expect(c.findPortWithName('test')).toBe(undefined);

    UndoQueue.instance.undo();

    expect(c.findPortWithName('test')).not.toBe(undefined);
  });

  it('can add group and port', function () {
    expect(cp.performAddGroup('G1').success).toBe(true);
    expect(cp.performAdd('P1').success).toBe(true);
    cp.renderPorts(true);

    expect(c.findPortWithName('P1').group).toBe('G1');
  });

  it('can rename group', function () {
    cp.performAddGroup('G1');
    cp.performAdd('P1');
    cp.renderPorts(true);

    expect(
      cp.performRenameGroup({
        newName: 'G2',
        item: cp.findGroupWithName('G1')
      }).success
    ).toBe(true);

    expect(c.findPortWithName('P1').group).toBe('G2');
  });

  it('cannot add group with unqualified name', function () {
    cp.performAddGroup('G2');
    cp.performAdd('P1');
    cp.renderPorts(true);

    expect(cp.performAddGroup('G2').success).toBe(false); // Existing group
    expect(cp.performAddGroup('').success).toBe(false); // Empty name
  });

  it('can delete group', function () {
    cp.performAddGroup('G2');
    cp.performAdd('P1');
    cp.renderPorts(true);

    expect(cp.performDeleteGroup(cp.findGroupWithName('G2')).success).toBe(true);
    expect(c.findPortWithName('P1').group).toBe(undefined);
  });
});

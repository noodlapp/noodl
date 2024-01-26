const { PropertyEditor } = require('@noodl-views/panels/propertyeditor/propertyeditor');
const { NodeGraphNodeRename } = require('@noodl-views/panels/propertyeditor');

const { ProjectModel } = require('@noodl-models/projectmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const { UndoQueue } = require('@noodl-models/undo-queue-model');

describe('Property editor panel unit tests', function () {
  var pe, n, c;

  beforeEach(() => {
    ProjectModel.instance = ProjectModel.fromJSON(project);
    NodeLibrary.instance.registerModule(ProjectModel.instance);

    c = ProjectModel.instance.getComponentWithName('Root');
    n = c.graph.findNodeWithId('A');
    pe = new PropertyEditor({
      model: n
    });
    pe.render();
  });

  afterEach((done) => {
    //some tests schedule renders with a setTimeout
    //so schedule one ourselves before we clean up so the console
    //isn't filled with errors
    setTimeout(() => {
      ProjectModel.instance = undefined;
      done();
    }, 1);
  });

  it('can delete node and undo', function () {
    pe.performDelete();

    expect(c.graph.findNodeWithId('A')).toBe(undefined);
    expect(c.graph.connections.length).toBe(0);

    UndoQueue.instance.undo();

    expect(c.graph.findNodeWithId('A')).not.toBe(undefined);
    expect(c.graph.connections.length).toBe(1);
  });

  it('can rename and undo', function () {
    NodeGraphNodeRename(n, 'test');

    expect(c.graph.findNodeWithId('A').label).toBe('test');

    UndoQueue.instance.undo();

    expect(c.graph.findNodeWithId('A').label).toBe('group');
  });

  it('can edit parameter and undo', function () {
    pe.portsView.setParameter('alpha', 0.5);

    expect(c.graph.findNodeWithId('A').parameters['alpha']).toBe(0.5);

    UndoQueue.instance.undo();

    expect(c.graph.findNodeWithId('A').parameters['alpha']).toBe(undefined);
  });

  var project = {
    components: [
      {
        name: 'Root',
        graph: {
          roots: [
            {
              id: 'A',
              type: 'group'
            },
            {
              id: 'B',
              type: 'group'
            }
          ],
          connections: [
            {
              fromId: 'A',
              toId: 'B',
              fromProperty: 'x',
              toProperty: 'y'
            }
          ]
        }
      }
    ]
  };
});

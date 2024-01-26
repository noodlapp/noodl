const CreateNewNodePanel = require('@noodl-views/createnewnodepanel');
const { ProjectModel } = require('@noodl-models/projectmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;

describe('Create new node panel unit tests', function () {
  var p, cp;

  xit('can setup panel', function () {
    ProjectModel.instance = new ProjectModel();

    p = ProjectModel.fromJSON(project);

    cp = new CreateNewNodePanel({
      model: p.getComponentWithName('Root').graph,
      pos: {
        x: 100,
        y: 50
      },
      runtimeType: 'browser'
    });
    cp.render();
    expect(cp).not.toBe(undefined);
  });

  xit('can create nodes', function () {
    var c = p.getComponentWithName('Root');
    cp.performCreate(NodeLibrary.instance.getNodeTypeWithName('group'));

    expect(c.graph.roots.length).toBe(2);
    expect(c.graph.roots[1].type).toBe(NodeLibrary.instance.getNodeTypeWithName('group'));
    expect(c.graph.roots[1].x).toBe(100);
    expect(c.graph.roots[1].y).toBe(50);
    expect(c.graph.roots[1].version).toBe(2);
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
            }
          ]
        }
      }
    ]
  };
});

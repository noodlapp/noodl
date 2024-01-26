const { ProjectModel } = require('@noodl-models/projectmodel');

describe('Conditional ports tests', function () {
  beforeEach(() => {
    ProjectModel.instance = ProjectModel.fromJSON({
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'Anim',
                id: 'A-1',
                parameters: {
                  type: 'typeA'
                }
              }
            ]
          }
        }
      ]
    });
  });

  xit('can get correct ports after load', function () {
    var ports = ProjectModel.instance.findNodeWithId('A-1').getPorts();
    expect(ports.length).toBe(2);
    expect(ports[1]).toEqual({
      name: 'from',
      plug: 'input',
      type: 'number',
      index: 1
    });
  });

  xit('can react to param changes', function () {
    ProjectModel.instance.findNodeWithId('A-1').setParameter('type', 'typeB');

    var ports = ProjectModel.instance.findNodeWithId('A-1').getPorts();
    expect(ports.length).toBe(2);
    expect(ports[1]).toEqual({
      name: 'to',
      plug: 'input',
      type: 'number',
      index: 1
    });
  });
});

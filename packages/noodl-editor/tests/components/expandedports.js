const { ProjectModel } = require('@noodl-models/projectmodel');

describe('Expanded ports tests', function () {
  beforeEach(() => {
    ProjectModel.instance = ProjectModel.fromJSON(getProject());
  });

  xit('can get correct ports after load', function () {
    var ports = ProjectModel.instance.findNodeWithId('EP-1').getPorts();
    expect(ports.length).toBe(3);
    expect(ports[1]).toEqual({
      name: 'Affe.A',
      index: 101,
      plug: 'input',
      type: 'number'
    });
    expect(ports[2]).toEqual({
      name: 'Affe.B',
      index: 102,
      plug: 'input',
      type: 'number'
    });
  });

  xit('can react to param changes', function () {
    ProjectModel.instance.findNodeWithId('EP-1').setParameter('Affe.A', 'something');

    var ports = ProjectModel.instance.findNodeWithId('EP-1').getPorts();
    expect(ports.length).toBe(2);
    expect(ports[1]).toEqual({
      name: 'Affe.A',
      index: 101,
      plug: 'input',
      type: 'number'
    });
  });

  xit('can rename ports and parameters are copied', function () {
    ProjectModel.instance.findNodeWithId('EP-2').setParameter('Bosse.A', 'grr');

    ProjectModel.instance.findNodeWithId('EP-2').renamePortWithName('Bosse', 'Oscar');

    expect(ProjectModel.instance.findNodeWithId('EP-2').parameters['Oscar.A']).toBe('grr');
    expect(ProjectModel.instance.findNodeWithId('EP-2').parameters['Bosse.A']).toBe(undefined);
  });

  function getProject() {
    return {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'ExpandPorts',
                id: 'EP-1',
                ports: [
                  {
                    type: 'number',
                    name: 'Affe',
                    plug: 'input'
                  }
                ]
              },
              {
                type: 'ExpandPorts',
                id: 'EP-2',
                ports: [
                  {
                    type: 'number',
                    name: 'Bosse',
                    plug: 'input'
                  }
                ]
              }
            ]
          }
        }
      ]
    };
  }
});

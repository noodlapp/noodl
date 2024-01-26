const { ProjectModel } = require('@noodl-models/projectmodel');

describe('Dynamic ports from viewer tests', function () {
  // Setup
  var projectJSON = {
    components: [
      {
        name: 'Root',
        graph: {
          connections: [
            {
              fromId: 'A',
              fromProperty: 'dynaA',
              toId: 'B',
              toProperty: 'x'
            },
            {
              fromId: 'B',
              fromProperty: 'y',
              toId: 'A',
              toProperty: 'dynaB'
            }
          ],
          roots: [
            {
              type: 'rectangle',
              id: 'A',
              parameters: {
                dynaA: 10,
                dynaB: 'hej'
              }
            },
            {
              type: 'rectangle',
              id: 'B'
            }
          ]
        }
      }
    ]
  };

  var project = ProjectModel.fromJSON(projectJSON);

  it('can rename inputs', function () {
    var n = project.findNodeWithId('A');

    n.setDynamicPorts([
      {
        name: 'dynaA',
        type: 'number'
      },
      {
        name: 'dynaB',
        type: 'string'
      }
    ]);

    // Now renamed
    n.setDynamicPorts(
      [
        {
          name: 'bosseA',
          type: 'number'
        },
        {
          name: 'bosseB',
          type: 'string'
        }
      ],
      {
        renamed: {
          plug: 'input',
          patterns: ['{{*}}A', '{{*}}B'],
          before: 'dyna',
          after: 'bosse'
        }
      }
    );

    expect(n.parameters['bosseA']).toBe(10);
    expect(n.parameters['bosseB']).toBe('hej');
    expect(n.parameters['dynaA']).toBe(undefined);
    expect(n.parameters['dynaB']).toBe(undefined);

    expect(project.getComponentWithName('Root').graph.connections[0].fromProperty).toBe('bosseA');
    expect(project.getComponentWithName('Root').graph.connections[1].toProperty).toBe('bosseB');
  });
});

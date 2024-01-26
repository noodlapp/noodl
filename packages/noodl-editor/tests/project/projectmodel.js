const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const { ProjectModel } = require('@noodl-models/projectmodel');
const WarningsModel = require('@noodl-models/warningsmodel').WarningsModel;

describe('Project model tests', function () {
  it('can upgrade from 0 to 1', function () {
    var p = ProjectModel.fromJSON(project0);

    // Project upgrader from 0 to 1 should replace = types with * types
    var json = JSON.stringify(p.toJSON());
    expect(json.indexOf('=')).toBe(-1);
    expect(json.match(/\*/g).length).toBe(2);
  });

  xit('can apply patch', function () {
    var p = ProjectModel.fromJSON(project1);

    // Apply patch
    p.applyPatch({
      askPermission: false,
      notifyUser: false,
      nodePatches: [
        {
          nodeId: 'A',
          typename: 'group',
          version: 3,
          params: {
            x: 20,
            alignX: null,
            alignY: 'top'
          }
        }
      ]
    });

    expect(p.findNodeWithId('A').type instanceof NodeLibrary.BasicNodeType).toBe(true);
    expect(p.findNodeWithId('A').type.name).toBe('group');
    expect(p.findNodeWithId('A').version).toBe(3);
    expect(p.findNodeWithId('A').getParameter('x')).toBe(20);
    expect(p.findNodeWithId('A').getParameter('alignX')).toBe(undefined);
    expect(p.findNodeWithId('A').getParameter('alignY')).toBe('top');

    // Ask permission, should not apply patch immediately
    p.applyPatch({
      key: 'a',
      askPermission: true,
      notifyUser: false,
      nodePatches: [
        {
          nodeId: 'A',
          params: {
            alignY: 'bottom'
          }
        }
      ],
      dismissPatches: [
        {
          nodeId: 'A',
          params: {
            alignY: null
          }
        }
      ]
    });

    expect(WarningsModel.instance.warnings['/']['/']['patch-a']).not.toBe(undefined); // Warnings should be generated
    expect(p.findNodeWithId('A').getParameter('alignY')).toBe('top');

    // Emulate user clicking patch
    WarningsModel.instance.warnings['/']['/']['patch-a'].warning.onPatch();
    expect(p.findNodeWithId('A').getParameter('alignY')).toBe('bottom');

    // Ask permission, should not apply patch immediately
    p.applyPatch({
      key: 'a',
      askPermission: true,
      notifyUser: false,
      nodePatches: [],
      dismissPatches: [
        {
          nodeId: 'A',
          params: {
            alignY: null
          }
        }
      ]
    });

    // Emulate user clicking dismiss
    WarningsModel.instance.warnings['/']['/']['patch-a'].warning.onDismiss();
    expect(p.findNodeWithId('A').getParameter('alignY')).toBe(undefined);
  });

  xit('can apply settings patch', function () {
    var p = ProjectModel.fromJSON(project1);

    p.applyPatch({
      askPermission: false,
      notifyUser: false,
      settingsPatch: {
        s1: null,
        s2: 'Wohoo'
      }
    });

    expect(p.getSettings().s1).toBe(undefined);
    expect(p.getSettings().s2).toBe('Wohoo');
  });

  // Project that should be patched
  var project1 = {
    components: [
      {
        name: 'comp1',
        graph: {
          roots: [
            {
              id: 'A',
              type: 'image',
              parameters: {
                x: 10,
                alignX: 'left'
              }
            }
          ]
        },
        settings: {
          s1: 'Hello'
        }
      }
    ]
  };

  // Old project model that should be upgraded
  var project0 = {
    components: [
      {
        name: 'comp1',
        graph: {
          roots: [
            {
              id: 'ES-1',
              type: 'Event Sender',
              ports: [
                {
                  type: '=',
                  name: 'a port'
                }
              ]
            }
          ]
        }
      },
      {
        name: 'comp2',
        graph: {
          roots: [
            {
              id: 'ES-1',
              type: 'Event Sender',
              ports: [
                {
                  type: {
                    name: '='
                  },
                  name: 'a port'
                }
              ]
            }
          ]
        }
      }
    ]
  };
});

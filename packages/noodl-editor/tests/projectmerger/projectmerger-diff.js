var { diffProject } = require('@noodl-utils/projectmerger.diff');
var fs = require('fs');
var Process = require('process');

// Project settings
describe('Project merger diff', function () {
  it('can diff two identical projects without reporting any changes', function () {
    const base = JSON.parse(
      fs.readFileSync(
        Process.cwd() + '/tests/testfs/merge-tests/move-nodes/base-merge-project-Wed--03-Feb-2021-11-07-55-GMT.json'
      )
    );
    const diff = diffProject(base, base);

    expect(diff.components.changed.length).toBe(0, 'no changed components');
    expect(diff.components.created.length).toBe(0, 'no created components');
    expect(diff.components.deleted.length).toBe(0, 'no deleted components');
    expect(diff.components.unchanged.length).toBe(base.components.length, 'all components unchanged');
  });

  it('can diff with one node changes', function () {
    const base = JSON.parse(
      fs.readFileSync(
        Process.cwd() + '/tests/testfs/merge-tests/move-nodes/base-merge-project-Wed--03-Feb-2021-11-07-55-GMT.json'
      )
    );
    const current = JSON.parse(JSON.stringify(base));

    //modify a text node
    current.components[0].graph.roots[0].children[0].parameters.text = 'Hello 2';

    const diff = diffProject(base, current);

    expect(diff.components.changed.length).toBe(1, 'should have one changed component');
    expect(diff.components.created.length).toBe(0, 'no created components');
    expect(diff.components.deleted.length).toBe(0, 'no deleted components');
    expect(diff.components.unchanged.length).toBe(base.components.length - 1);
  });

  it('diff ignores metadata', function () {
    const base = JSON.parse(
      fs.readFileSync(
        Process.cwd() + '/tests/testfs/merge-tests/move-nodes/base-merge-project-Wed--03-Feb-2021-11-07-55-GMT.json'
      )
    );
    const current = JSON.parse(JSON.stringify(base));

    // change metadata in component
    current.components[0].metadata.canvasPos.x = 50;
    current.components[0].graph.roots[0].dynamicports = [
      {
        name: 'testy',
        type: 'string'
      }
    ];

    //change metadata in node
    current.components[0].graph.roots[0].metadata = {
      sourceCodePorts: ['test']
    };

    const diff = diffProject(base, current);

    expect(diff.components.changed.length).toBe(0, 'no changed components');
    expect(diff.components.created.length).toBe(0, 'no created components');
    expect(diff.components.deleted.length).toBe(0, 'no deleted components');
    expect(diff.components.unchanged.length).toBe(base.components.length, 'all components unchanged');
  });

  it('can diff variants', function () {
    const base = {
      components: [],
      variants: [
        {
          name: 'A',
          typename: 'A',
          parameters: {
            p1: 10
          }
        },
        {
          name: 'A',
          typename: 'B',
          parameters: {
            p1: 'test'
          }
        },
        {
          name: 'C',
          typename: 'C',
          parameters: {
            p1: 10
          }
        }
      ]
    };
    const current = {
      components: [],
      variants: [
        {
          name: 'A',
          typename: 'A',
          parameters: {
            p2: 20
          }
        },
        {
          name: 'B',
          typename: 'A',
          parameters: {
            p1: 'test'
          }
        },
        {
          name: 'C',
          typename: 'C',
          parameters: {
            p1: 10
          }
        }
      ]
    };

    const diff = diffProject(base, current);

    expect(diff.variants.changed.length).toBe(1);
    expect(diff.variants.created.length).toBe(1);
    expect(diff.variants.unchanged.length).toBe(1);
  });

  it('can diff settings', function () {
    const base = {
      components: [],
      settings: {
        htmlTitle: 'A',
        headCode: 'lolol',
        someSetting: 'abc'
      }
    };
    const current = {
      components: [],
      settings: {
        htmlTitle: 'B',
        bodyScroll: true,
        someSetting: 'abc'
      }
    };
    const diff = diffProject(base, current);

    expect(diff.settings.changed.length).toBe(1);
    expect(diff.settings.created.length).toBe(1);
    expect(diff.settings.deleted.length).toBe(1);
    expect(diff.settings.unchanged.length).toBe(1);
  });
});

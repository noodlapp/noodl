const { ProjectModel } = require('@noodl-models/projectmodel');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const WarningsModel = require('@noodl-models/warningsmodel').WarningsModel;

describe('Conflict warnings', function () {
  var p;

  beforeEach(() => {
    window.NodeLibraryData = require('../nodegraph/nodelibrary');
    NodeLibrary.instance.loadLibrary();

    p = ProjectModel.fromJSON(getProject());
    ProjectModel.instance = p;
  });

  it('can load project', function () {
    expect(p).not.toBe(undefined);
  });

  it('can count total number of conflicts', function () {
    p.getComponentWithName('comp1').graph.evaluateHealth();
    p.getComponentWithName('comp2').graph.evaluateHealth();
    p.getComponentWithName('comp3').graph.evaluateHealth();

    expect(
      WarningsModel.instance.getTotalNumberOfWarningsMatching(
        (key, ref, warning) => warning.warning.type === 'conflict'
      )
    ).toBe(4);
  });

  it('can count warnings for a components', function () {
    const c = p.getComponentWithName('comp1');
    c.graph.evaluateHealth();
    let warnings = WarningsModel.instance.getNumberOfWarningsForComponent(c);
    expect(warnings).toBe(1);

    //conflict warnings are global, so test counting all non-global conflicts as well
    warnings = WarningsModel.instance.getNumberOfWarningsForComponent(c, {
      excludeGlobal: true
    });
    expect(warnings).toBe(0);
  });

  it('can detect param conflict warnings', function () {
    var c = p.getComponentWithName('comp1');
    c.graph.evaluateHealth();

    var w = WarningsModel.instance.warnings['comp1'];
    expect(w['node/A']['node-param-conflict-A']).not.toBe(undefined);
    expect(WarningsModel.instance.getNumberOfWarningsForComponent(c)).toBe(1);
  });

  it('can detect type conflict warnings', function () {
    var c = p.getComponentWithName('comp2');
    c.graph.evaluateHealth();

    var w = WarningsModel.instance.warnings['comp2'];
    expect(w['node/B']['node-type-conflict']).not.toBe(undefined);
    expect(WarningsModel.instance.getNumberOfWarningsForComponent(c)).toBe(1);
  });

  it('can clear warnings', function () {
    // Clear the warning
    var c = p.getComponentWithName('comp1');
    WarningsModel.instance.setWarning(
      {
        component: c,
        node: c.graph.roots[0],
        key: 'node-param-conflict-A'
      },
      undefined
    );
    expect(WarningsModel.instance.hasComponentWarnings(c)).toBe(false);

    // Clear warnings
    var c = p.getComponentWithName('comp2');
    WarningsModel.instance.clearWarningsForRef({
      component: c,
      node: c.graph.roots[0]
    });
    expect(WarningsModel.instance.hasComponentWarnings(c)).toBe(false);
  });

  it('can format warnings', function () {
    var c = p.getComponentWithName('comp3');
    c.graph.evaluateHealth();

    var w = WarningsModel.instance.warnings['comp3'];
    expect(w['node/C']['node-param-conflict-alignX']).not.toBe(undefined);
    expect(w['node/C']['node-param-conflict-alignX'].warning.message).toEqual('Merge conflict at parameter AlignX');
    expect(w['node/C']['node-param-conflict-x']).not.toBe(undefined);
    expect(w['node/C']['node-param-conflict-x'].warning.message).toEqual('Merge conflict at parameter x');
  });

  it('clear warnings when project is unloaded', function () {
    var c = p.getComponentWithName('comp1');
    c.graph.evaluateHealth();
    expect(WarningsModel.instance.hasComponentWarnings(c)).toBe(true);

    ProjectModel.instance = undefined;
    expect(WarningsModel.instance.warnings).toEqual({});
  });

  function getProject() {
    return {
      name: 'p',
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'group',
                id: 'A',
                conflicts: [
                  {
                    type: 'parameter',
                    name: 'A',
                    ours: 0,
                    theirs: 1
                  }
                ]
              }
            ],
            connections: []
          }
        },
        {
          name: 'comp2',
          graph: {
            roots: [
              {
                type: 'group',
                id: 'B',
                conflicts: [
                  {
                    type: 'typename',
                    ours: '/a',
                    theirs: '/b'
                  }
                ]
              }
            ]
          }
        },
        {
          name: 'comp3',
          graph: {
            roots: [
              {
                type: 'group',
                id: 'C',
                conflicts: [
                  {
                    type: 'parameter',
                    name: 'x',
                    ours: {
                      value: 10,
                      unit: '%'
                    },
                    theirs: 10
                  },
                  {
                    type: 'parameter',
                    name: 'alignX',
                    ours: 'left',
                    theirs: 'right'
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

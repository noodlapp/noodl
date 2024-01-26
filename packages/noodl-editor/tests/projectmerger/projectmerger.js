const ProjectMerger = require('@noodl-utils/projectmerger');
const NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
const { ProjectModel } = require('@noodl-models/projectmodel');
const fs = require('fs');

window.NodeLibraryData = require('../nodegraph/nodelibrary');

// Project settings
describe('Project merger', function () {
  it('can remove components in merge', function () {
    var base = JSON.parse(
      fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/remove-component/project-base.json')
    );
    var ours = JSON.parse(
      fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/remove-component/project-ours.json')
    );
    var remote = JSON.parse(
      fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/remove-component/project-theirs.json')
    );

    var res = ProjectMerger.mergeProject(base, ours, remote);

    expect(res.components.length).toBe(2);
    expect(res.components[1].name).toBe('/Component One');
  });

  it('can merge in moved nodes', function () {
    var base = JSON.parse(
      fs.readFileSync(
        process.cwd() + '/tests/testfs/merge-tests/move-nodes/base-merge-project-Wed--03-Feb-2021-11-07-55-GMT.json'
      )
    );
    var ours = JSON.parse(
      fs.readFileSync(
        process.cwd() + '/tests/testfs/merge-tests/move-nodes/ours-merge-project-Wed--03-Feb-2021-11-07-55-GMT.json'
      )
    );
    var remote = JSON.parse(
      fs.readFileSync(
        process.cwd() + '/tests/testfs/merge-tests/move-nodes/remote-merge-project-Wed--03-Feb-2021-11-07-55-GMT.json'
      )
    );

    var x = remote.components[0].graph.roots[1].x;
    var y = remote.components[0].graph.roots[1].y;

    var res = ProjectMerger.mergeProject(base, ours, remote);

    expect(res.components[0].graph.roots[1].x).toBe(x);
    expect(res.components[0].graph.roots[1].y).toBe(y);
  });

  it('deletes nodes even if they were moved (remote delete)', function () {
    var base = JSON.parse(
      fs.readFileSync(
        process.cwd() +
          '/tests/testfs/merge-tests/remove-moved-nodes/base-merge-project-Wed--03-Feb-2021-08-12-22-GMT.json'
      )
    );
    var ours = JSON.parse(
      fs.readFileSync(
        process.cwd() +
          '/tests/testfs/merge-tests/remove-moved-nodes/ours-merge-project-Wed--03-Feb-2021-08-12-22-GMT.json'
      )
    );
    var remote = JSON.parse(
      fs.readFileSync(
        process.cwd() +
          '/tests/testfs/merge-tests/remove-moved-nodes/remote-merge-project-Wed--03-Feb-2021-08-12-22-GMT.json'
      )
    );

    var res = ProjectMerger.mergeProject(base, ours, remote);

    expect(res.components[0].graph.roots.length).toBe(1);
    expect(res.components[0].graph.roots[0].type).toBe('Group');
  });

  it('deletes nodes even if they were moved (local delete)', function () {
    var base = JSON.parse(
      fs.readFileSync(
        process.cwd() +
          '/tests/testfs/merge-tests/remove-moved-nodes/base-merge-project-Wed--03-Feb-2021-13-33-47-GMT.json'
      )
    );
    var ours = JSON.parse(
      fs.readFileSync(
        process.cwd() +
          '/tests/testfs/merge-tests/remove-moved-nodes/ours-merge-project-Wed--03-Feb-2021-13-33-47-GMT.json'
      )
    );
    var remote = JSON.parse(
      fs.readFileSync(
        process.cwd() +
          '/tests/testfs/merge-tests/remove-moved-nodes/remote-merge-project-Wed--03-Feb-2021-13-33-47-GMT.json'
      )
    );

    var res = ProjectMerger.mergeProject(base, ours, remote);

    expect(res.components[0].graph.roots.length).toBe(1);
    expect(res.components[0].graph.roots[0].type).toBe('Group');
  });

  it('can handle component rename', function () {
    var base = JSON.parse(
      fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/base-merge-project-Thu--06-Aug-2020-15-29-38-GMT.json')
    );
    var ours = JSON.parse(
      fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/ours-merge-project-Thu--06-Aug-2020-15-29-38-GMT.json')
    );
    var remote = JSON.parse(
      fs.readFileSync(
        process.cwd() + '/tests/testfs/merge-tests/remote-merge-project-Thu--06-Aug-2020-15-29-38-GMT.json'
      )
    );

    var res = ProjectMerger.mergeProject(base, ours, remote);

    expect(res.components[3].name).toBe('/UI Components/UI Elements/Rider Section - List Item');
  });

  it('can merge component rename', function () {
    // Test component renamed
    var a = {
      components: [
        {
          id: 'A',
          name: 'comp1',
          graph: {
            roots: []
          }
        },
        {
          id: 'B',
          name: 'comp2',
          graph: {
            roots: []
          }
        }
      ]
    };
    var o = {
      components: [
        {
          id: 'A',
          name: 'renamed1',
          graph: {
            roots: []
          }
        },
        {
          id: 'B',
          name: 'comp2',
          graph: {
            roots: []
          }
        }
      ]
    };
    var t = {
      components: [
        {
          id: 'A',
          name: 'renamed2',
          graph: {
            roots: [],
            connections: []
          }
        },
        {
          id: 'B',
          name: 'comp2',
          graph: {
            roots: []
          }
        }
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);

    // Ids are used instead of names as keys
    expect(res).toEqual({
      components: [
        {
          id: 'A',
          name: 'renamed1',
          graph: {
            roots: [],
            connections: [],
            comments: []
          }
        },
        {
          id: 'B',
          name: 'comp2',
          graph: {
            roots: []
          }
        }
      ]
    });
  });

  it('can merge labels', function () {
    var a = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                id: 'A',
                label: 'a'
              }
            ],
            connections: []
          }
        }
      ]
    };
    var o = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                id: 'A',
                label: 'd'
              }
            ],
            connections: []
          }
        }
      ]
    };
    var t = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                id: 'A',
                label: 'c'
              }
            ],
            connections: []
          }
        }
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);
    expect(res.components[0].graph.roots[0].label).toEqual('d');
  });

  it('can be merged', function () {
    var a = {
      name: 'p1',
      settings: {
        canvasWidth: 370,
        canvasHeight: 370
      },
      rootNodeId: '2d3ccd33-f1ef-2dc5-3e1a-ca9d61cd222b',
      components: []
    };
    var o = {
      name: 'p1',
      settings: {
        canvasWidth: 170,
        canvasHeight: 170
      },
      rootNodeId: '2d3ccd33-f1ef-2dc5-3e1a-ca9d61cd222b',
      components: []
    };
    var t = {
      name: 'p3',
      settings: {
        canvasWidth: 170,
        canvasHeight: 270
      },
      rootNodeId: '2d3ccd33-f1ef-2dc5-3e1a-ca9d61cd222b',
      components: []
    };

    var res = ProjectMerger.mergeProject(a, o, t);
    expect(res.name).toBe('p3');
    expect(res.settings.canvasWidth).toBe(170);
    expect(res.settings.canvasHeight).toBe(170); // Should be overridden by ours
  });

  it('can merge added and removed', function () {
    // Test component added and removed
    var a = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: []
          }
        },
        {
          name: 'comp3',
          graph: {
            roots: []
          }
        }
      ]
    };
    var o = {
      components: [
        // Deleted comp1
        // Changed comp3
        {
          name: 'comp3',
          graph: {
            roots: [],
            connections: []
          }
        }
      ]
    };
    var t = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: []
          }
        },
        {
          name: 'comp2',
          graph: {
            roots: []
          }
        }
        // Removed comp3
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);

    // Local branch have deleted comp1 and their branch have created comp2
    expect(res).toEqual({
      components: [
        {
          name: 'comp3',
          graph: {
            roots: [],
            connections: []
          }
        },
        {
          name: 'comp2',
          graph: {
            roots: []
          }
        }
      ]
    });
  });

  it('can merge connections', function () {
    // Test component added and removed
    var a = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              },
              {
                type: '0',
                id: 'C'
              }
            ],
            connections: [
              {
                fromId: 'A',
                toId: 'B',
                fromProperty: '0',
                toProperty: '1'
              }
            ]
          }
        }
      ]
    };
    var o = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              },
              {
                type: '0',
                id: 'C'
              }
            ],
            connections: [
              // Removed A-B
              // Added A-C
              {
                fromId: 'A',
                toId: 'C',
                fromProperty: '0',
                toProperty: '1'
              }
            ]
          }
        }
      ]
    };
    var t = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              },
              {
                type: '0',
                id: 'C'
              }
            ],
            connections: [
              {
                fromId: 'A',
                toId: 'B',
                fromProperty: '0',
                toProperty: '1'
              },
              // Added A-B 0 - 2
              {
                fromId: 'A',
                toId: 'B',
                fromProperty: '0',
                toProperty: '2'
              }
            ]
          }
        }
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);

    expect(res.components[0].graph.connections).toContain({
      fromId: 'A',
      toId: 'B',
      fromProperty: '0',
      toProperty: '2'
    });
    expect(res.components[0].graph.connections).toContain({
      fromId: 'A',
      toId: 'C',
      fromProperty: '0',
      toProperty: '1'
    });
  });

  it('can merge nodes add/remove', function () {
    var a = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B',
                children: [
                  {
                    type: '0',
                    id: 'C'
                  },
                  {
                    type: '0',
                    id: 'D'
                  }
                ]
              }
            ],
            connections: []
          }
        }
      ]
    };
    var o = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              // Removed A
              {
                type: '0',
                id: 'B',
                children: [
                  {
                    type: '0',
                    id: 'C'
                  },
                  // Removed D
                  // Added E
                  {
                    type: '0',
                    id: 'E'
                  }
                ]
              }
            ],
            connections: []
          }
        }
      ]
    };
    var t = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              // Added F
              {
                type: '0',
                id: 'F'
              },
              // Changed A
              {
                type: '1',
                id: 'A'
              },
              {
                type: '0',
                id: 'B',
                children: [
                  {
                    type: '0',
                    id: 'C'
                  },
                  {
                    type: '0',
                    id: 'D'
                  }
                ]
              }
            ],
            connections: []
          }
        }
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);
    expect(res.components[0].graph.roots[0]).toEqual({
      type: '0',
      id: 'B',
      ports: [],
      parameters: undefined,
      children: [
        {
          children: undefined,
          type: '0',
          id: 'C'
        },
        {
          children: undefined,
          type: '0',
          id: 'E'
        }
      ]
    });
    expect(res.components[0].graph.roots[1]).toEqual({
      children: undefined,
      type: '0',
      id: 'F'
    });
    expect(res.components[0].graph.roots[2]).toEqual({
      children: undefined,
      type: '1',
      id: 'A'
    });
  });

  it('can merge parameters', function () {
    var a = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A',
                parameters: {
                  p1: 'some-string',
                  p3: 'delete-me'
                }
              }
            ],
            connections: []
          }
        }
      ]
    };
    var o = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A',
                parameters: {
                  p1: 'changed',
                  p2: 'added-string',
                  p3: 'delete-me'
                }
              }
            ],
            connections: []
          }
        }
      ]
    };
    var t = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A',
                parameters: {
                  p1: 10
                  // Deleted p3
                }
              }
            ],
            connections: []
          }
        }
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);
    expect(res.components[0].graph.roots[0]).toEqual({
      type: '0',
      id: 'A',
      parameters: {
        p1: 'changed',
        p2: 'added-string',
        p3: undefined
      },
      ports: [],
      conflicts: [
        {
          type: 'parameter',
          name: 'p1',
          ours: 'changed',
          theirs: 10
        }
      ],
      children: undefined
    });
  });

  it('can merge source code parameters', function () {
    NodeLibraryData.nodetypes.push({
      name: 'code-node-type',
      ports: [
        {
          name: 'p1',
          type: {
            name: 'string',
            codeeditor: 'javascript'
          },
          plug: 'input'
        }
      ],
      dynamicports: [
        {
          ports: [
            {
              name: 'p2',
              type: {
                name: 'string',
                codeeditor: 'javascript'
              },
              plug: 'input'
            }
          ]
        }
      ]
    });
    NodeLibrary.instance.reload();

    var a = ProjectModel.fromJSON({
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'code-node-type',
                id: 'A',
                parameters: {
                  p1: 'some-string',
                  p2: 'if(a==3){\nconsole.log("hej");\n}\ntjo()\n'
                }
              }
            ],
            connections: []
          }
        }
      ]
    });

    var o = ProjectModel.fromJSON({
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'code-node-type',
                id: 'A',
                parameters: {
                  p1: 'changed',
                  p2: 'if(a==3){\nconsole.log("hej ho");\n}\ntjo()\n'
                }
              }
            ],
            connections: []
          }
        }
      ]
    });

    var t = ProjectModel.fromJSON({
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'code-node-type',
                id: 'A',
                parameters: {
                  p1: 'changed2',
                  p2: 'if(a==3){\nconsole.log("new!!");\n}\ntjo()\n'
                }
              }
            ],
            connections: []
          }
        }
      ]
    });

    var res = ProjectMerger.mergeProject(a.toJSON(), o.toJSON(), t.toJSON());
    expect(res.components[0].graph.roots[0].parameters['p2']).toBe(
      'if(a==3){\n------------- Original -------------\nconsole.log("hej");\n------------- Ours -------------\nconsole.log("hej ho");\n------------- Theirs -------------\nconsole.log("new!!");\n-------------\n}\ntjo()\n'
    );
    expect(res.components[0].graph.roots[0].parameters['p1']).toBe(
      '\n------------- Original -------------\nsome-string\n------------- Ours -------------\nchanged\n------------- Theirs -------------\nchanged2\n-------------\n'
    );

    expect(res.components[0].graph.roots[0].conflicts).toEqual([
      {
        type: 'sourceCode',
        name: 'p1',
        oursDisplayName: '[Source code]',
        theirsDisplayName: '[Source code]',
        ours: '\n------------- Original -------------\nsome-string\n------------- Ours -------------\nchanged\n------------- Theirs -------------\nchanged2\n-------------\n',
        theirs: 'changed2'
      },
      {
        type: 'sourceCode',
        name: 'p2',
        oursDisplayName: '[Source code]',
        theirsDisplayName: '[Source code]',
        ours: 'if(a==3){\n------------- Original -------------\nconsole.log("hej");\n------------- Ours -------------\nconsole.log("hej ho");\n------------- Theirs -------------\nconsole.log("new!!");\n-------------\n}\ntjo()\n',
        theirs: 'if(a==3){\nconsole.log("new!!");\n}\ntjo()\n'
      }
    ]);
  });

  //There's a bug that can cause the ancestor to be null, make sure that doesn't crash the merge
  it('can merge source code parameters with missing ancestor', function () {
    NodeLibraryData.nodetypes.push({
      name: 'code-node-type',
      ports: [
        {
          name: 'p1',
          type: {
            name: 'string',
            codeeditor: 'javascript'
          },
          plug: 'input'
        }
      ],
      dynamicports: [
        {
          ports: [
            {
              name: 'p2',
              type: {
                name: 'string',
                codeeditor: 'javascript'
              },
              plug: 'input'
            }
          ]
        }
      ]
    });
    NodeLibrary.instance.reload();

    var a = ProjectModel.fromJSON({
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [],
            connections: []
          }
        }
      ]
    });
    var o = ProjectModel.fromJSON({
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'code-node-type',
                id: 'A',
                parameters: {
                  p1: 'changed1',
                  p2: 'if(a==3){\nconsole.log("hej ho");\n}\ntjo()\n'
                }
              }
            ],
            connections: []
          }
        }
      ]
    });
    var t = ProjectModel.fromJSON({
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'code-node-type',
                id: 'A',
                parameters: {
                  p1: 'changed2',
                  p2: 'if(a==3){\nconsole.log("new!!");\n}\ntjo()\n'
                }
              }
            ],
            connections: []
          }
        }
      ]
    });

    //no conflicts, and ours should've "won"
    var res = ProjectMerger.mergeProject(a.toJSON(), o.toJSON(), t.toJSON());
    expect(res.components[0].graph.roots[0].parameters['p2']).toBe('if(a==3){\nconsole.log("hej ho");\n}\ntjo()\n');
    expect(res.components[0].graph.roots[0].parameters['p1']).toBe('changed1');

    expect(res.components[0].graph.roots[0].conflicts).toEqual(undefined);
  });

  it('can merge type', function () {
    var a = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              },
              {
                type: '0',
                id: 'C'
              }
            ],
            connections: []
          }
        }
      ]
    };
    var o = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '1',
                id: 'A'
              },
              {
                type: '1',
                id: 'B'
              },
              {
                type: '0',
                id: 'C'
              }
            ],
            connections: []
          }
        }
      ]
    };
    var t = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '2',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              },
              {
                type: '1',
                id: 'C'
              }
            ],
            connections: []
          }
        }
      ]
    };
    var res = ProjectMerger.mergeProject(a, o, t);
    expect(res.components[0].graph.roots).toEqual([
      {
        type: '1',
        id: 'A',
        ports: [],
        conflicts: [
          {
            type: 'typename',
            ours: '1',
            theirs: '2'
          }
        ],
        children: undefined,
        parameters: undefined
      },
      {
        type: '1',
        id: 'B',
        children: undefined
      },
      {
        type: '1',
        id: 'C',
        children: undefined
      }
    ]);
  });

  it('can merge ports', function () {
    var a = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A',
                ports: [
                  {
                    name: 'A',
                    type: '*'
                  },
                  {
                    name: 'B',
                    type: 'number'
                  }
                ]
              }
            ],
            connections: []
          }
        }
      ]
    };
    var o = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A',
                ports: [
                  // Changed A
                  {
                    name: 'A',
                    type: 'string'
                  }
                  // Deleted B
                ]
              }
            ],
            connections: []
          }
        }
      ]
    };
    var t = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A',
                ports: [
                  // Changed A
                  {
                    name: 'A',
                    type: 'number'
                  },
                  {
                    name: 'B',
                    type: 'number'
                  },
                  // Added C
                  {
                    name: 'C',
                    type: 'number'
                  }
                ]
              }
            ],
            connections: []
          }
        }
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);
    expect(res.components[0].graph.roots[0].ports).toEqual([
      {
        name: 'A',
        type: 'string'
      },
      {
        name: 'C',
        type: 'number'
      }
    ]);
  });

  it('can merge projects where the same node is in ours and remote, but not base', function () {
    const base = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              }
            ]
          }
        }
      ]
    };

    const ours = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              }
            ]
          }
        }
      ]
    };

    const remote = JSON.parse(JSON.stringify(ours));

    var res = ProjectMerger.mergeProject(base, ours, remote);

    expect(res.components[0].graph.roots[0].id).toBe('A');
    expect(res.components[0].graph.roots[1].id).toBe('B');
  });

  it("can detect conflicts where a node is not in ancestor, and they're different", function () {
    const base = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              }
            ]
          }
        }
      ]
    };

    const ours = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B',
                parameters: {
                  p: 'ours'
                }
              }
            ]
          }
        }
      ]
    };

    const remote = JSON.parse(JSON.stringify(ours));
    remote.components[0].graph.roots[1].parameters.p = 'remote';

    var res = ProjectMerger.mergeProject(base, ours, remote);

    expect(res.components[0].graph.roots[0].id).toBe('A');
    expect(res.components[0].graph.roots[1].id).toBe('B');

    expect(res.components[0].graph.roots[1].conflicts, [
      {
        type: 'parameter',
        name: 'p',
        ours: 'ours',
        theirs: 'theirs'
      }
    ]);
  });

  it('can merge styles - ours no style, remote has styles', function () {
    const remote = {
      metadata: {
        styles: {
          colors: {
            'color style': '#FF191D'
          },
          text: {
            'text style': {
              fontFamily: 'Arial',
              fontSize: {
                value: '12',
                unit: 'px'
              }
            }
          }
        }
      }
    };

    const ours = {
      metadata: {
        styles: {}
      }
    };

    const ancestor = JSON.parse(JSON.stringify(ours));

    const res = ProjectMerger.mergeProject(ancestor, ours, remote);

    expect(res.metadata.styles).toEqual({
      colors: {
        'color style': '#FF191D'
      },
      text: {
        'text style': {
          fontFamily: 'Arial',
          fontSize: {
            value: '12',
            unit: 'px'
          }
        }
      }
    });
  });

  it('can merge styles - ours has style, remote has different styles', function () {
    const styles = {
      colors: {
        'color style': '#FF191D'
      },
      text: {
        'text style': {
          fontFamily: 'Arial',
          fontSize: {
            value: '12',
            unit: 'px'
          }
        }
      }
    };

    const ancestor = {
      metadata: {
        styles: {}
      }
    };

    const remote = {
      metadata: {
        styles: {
          colors: {
            'color style2': 'remote'
          },
          text: {
            'text style2': {
              fontFamily: 'Helvetica'
            }
          }
        }
      }
    };

    const ours = {
      metadata: {
        styles: styles
      }
    };

    const res = ProjectMerger.mergeProject(ancestor, ours, remote);

    expect(res.metadata.styles).toEqual({
      colors: {
        'color style': '#FF191D',
        'color style2': 'remote'
      },
      text: {
        'text style': {
          fontFamily: 'Arial',
          fontSize: {
            value: '12',
            unit: 'px'
          }
        },
        'text style2': {
          fontFamily: 'Helvetica'
        }
      }
    });
  });

  it('can merge styles - ours can remove styles', function () {
    const styles = {
      colors: {
        'color style': '#FF191D'
      },
      text: {
        'text style': {
          fontFamily: 'Arial',
          fontSize: {
            value: '12',
            unit: 'px'
          }
        }
      }
    };

    const ancestor = {
      metadata: {
        styles: styles
      }
    };
    const remote = {
      metadata: {
        styles: styles
      }
    };

    const ours = {
      metadata: {
        styles: {
          colors: {
            'another style': 'ours'
          }
        }
      }
    };

    const res = ProjectMerger.mergeProject(ancestor, ours, remote);

    expect(res.metadata.styles).toEqual({
      colors: {
        'another style': 'ours'
      }
    });
  });

  it('can merge styles - remote can remove styles', function () {
    const styles = {
      colors: {
        'color style': '#FF191D'
      },
      text: {
        'text style': {
          fontFamily: 'Arial',
          fontSize: {
            value: '12',
            unit: 'px'
          }
        }
      }
    };

    const ancestor = {
      metadata: {
        styles: styles
      }
    };
    const ours = {
      metadata: {
        styles: styles
      }
    };

    const remote = {
      metadata: {
        styles: {
          colors: {
            'another style': 'ours'
          }
        }
      }
    };

    const res = ProjectMerger.mergeProject(ancestor, ours, remote);

    expect(res.metadata.styles).toEqual({
      colors: {
        'another style': 'ours'
      }
    });
  });

  it('can merge without leaving dangling connections behind', function () {
    const base = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              }
            ]
          }
        }
      ]
    };

    const ours = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: '0',
                id: 'A'
              },
              {
                type: '0',
                id: 'B'
              }
            ],
            connections: [
              {
                fromId: 'A',
                toId: 'B',
                fromProperty: '0',
                toProperty: '1'
              }
            ]
          }
        }
      ]
    };

    const theirs = {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [],
            connections: []
          }
        }
      ]
    };

    const res = ProjectMerger.mergeProject(base, ours, theirs);

    expect(res.components[0].graph.roots).toEqual([]);
    expect(res.components[0].graph.connections).toEqual([]);
  });

  it('can merge a deleted root with only node metadata changed', function () {
    const base = JSON.parse(fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/deleted-root-node/base.json'));
    const ours = JSON.parse(fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/deleted-root-node/ours.json'));
    const theirs = JSON.parse(
      fs.readFileSync(process.cwd() + '/tests/testfs/merge-tests/deleted-root-node/theirs.json')
    );

    const res = ProjectMerger.mergeProject(base, ours, theirs);

    console.log(res);

    expect(
      res.components[0].graph.roots.find((root) => root.id === '649ac2e4-0aeb-4978-7d35-8283ba0b5715')
    ).toBeUndefined();
    expect(res.components[0].graph.roots.length).toBe(5);
  });
});

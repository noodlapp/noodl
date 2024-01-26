var ProjectMerger = require('@noodl-utils/projectmerger');
var NodeLibrary = require('@noodl-models/nodelibrary').NodeLibrary;
var fs = require('fs');
var Process = require('process');

// Project settings
describe('Project merger (variants)', function () {
  it('can merge variants (conflicts)', function () {
    var a = {
      components: [],
      variants: [
        {
          typename: 'Group',
          name: 'A',
          parameters: {
            test: 'hej'
          }
        }
      ]
    };
    var o = {
      components: [],
      variants: [
        {
          typename: 'Group',
          name: 'A',
          parameters: {
            test: 'hej2'
          },
          stateParameters: {
            hover: {
              test: 'a'
            }
          },
          stateTransitions: {
            hover: {
              p1: {
                dur: 500,
                curve: [0, 0, 0, 1]
              }
            }
          },
          defaultStateTransitions: {
            hover: {
              dur: 500,
              curve: [0, 0, 0, 1]
            }
          }
        }
      ]
    };
    var t = {
      components: [],
      variants: [
        {
          typename: 'Group',
          name: 'A',
          parameters: {
            test: 'hej3'
          },
          stateParameters: {
            hover: {
              test: 'b'
            }
          },
          stateTransitions: {
            hover: {
              p1: {
                dur: 0,
                curve: [0, 0, 0, 1]
              }
            }
          },
          defaultStateTransitions: {
            hover: {
              dur: 0,
              curve: [0, 0, 0, 1]
            }
          }
        }
      ]
    };

    var res = ProjectMerger.mergeProject(a, o, t);
    console.log(res);
    expect(res.variants[0]).toEqual({
      typename: 'Group',
      name: 'A',
      parameters: {
        test: 'hej2'
      },
      stateParameters: {
        hover: {
          test: 'a'
        }
      },
      stateTransitions: {
        hover: {
          p1: {
            dur: 500,
            curve: [0, 0, 0, 1]
          }
        }
      },
      defaultStateTransitions: {
        hover: {
          dur: 500,
          curve: [0, 0, 0, 1]
        }
      },
      conflicts: [
        {
          type: 'parameter',
          name: 'test',
          ours: 'hej2',
          theirs: 'hej3'
        },
        {
          type: 'stateParameter',
          state: 'hover',
          name: 'test',
          ours: 'a',
          theirs: 'b'
        },
        {
          type: 'stateTransition',
          state: 'hover',
          name: 'p1',
          ours: {
            dur: 500,
            curve: [0, 0, 0, 1]
          },
          theirs: {
            dur: 0,
            curve: [0, 0, 0, 1]
          }
        },
        {
          type: 'defaultStateTransition',
          state: 'hover',
          ours: {
            dur: 500,
            curve: [0, 0, 0, 1]
          },
          theirs: {
            dur: 0,
            curve: [0, 0, 0, 1]
          }
        }
      ]
    });
  });
});

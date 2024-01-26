const { ProjectModel } = require('@noodl-models/projectmodel');

describe('Port channels tests', function () {
  beforeEach(() => {
    ProjectModel.instance = ProjectModel.fromJSON(getProject());
  });

  afterAll(() => {
    //unregister the project model so subsequent tests arent affected
    //(the channels can affect other tests)
    ProjectModel.instance = undefined;
  });

  xit('can collect channel names', function () {
    var ports = ProjectModel.instance.findNodeWithId('ER-1').getPorts();
    expect(ports.length).toBe(1);
    expect(ports[0].name).toBe('channel');
    expect(ports[0].type).toEqual({
      name: 'enum',
      enums: ['channelA', 'channelB'],
      allowEditOnly: true
    });
  });

  xit('can collect ports when channel name is set', function () {
    ProjectModel.instance.findNodeWithId('ER-1').setParameter('channel', 'channelA');

    var ports = ProjectModel.instance.findNodeWithId('ER-1').getPorts();
    expect(ports.length).toBe(4);
    expect(ports[1]).toEqual({
      name: 'p1',
      type: '*',
      plug: 'output',
      index: 1
    });
    expect(ports[2]).toEqual({
      name: 'p2',
      type: '*',
      plug: 'output',
      index: 2
    });
    expect(ports[3]).toEqual({
      name: 'p3',
      type: '*',
      plug: 'output',
      index: 3
    });
  });

  xit('can react to port name change', function () {
    ProjectModel.instance.findNodeWithId('ER-1').setParameter('channel', 'channelA');
    ProjectModel.instance.findNodeWithId('ES-1').renamePortWithName('p2', 'p2b');

    var ports = ProjectModel.instance.findNodeWithId('ER-1').getPorts();
    expect(ports.length).toBe(5);
    expect(ports[1]).toEqual({
      name: 'p1',
      type: '*',
      plug: 'output',
      index: 1
    });
    expect(ports[2]).toEqual({
      name: 'p2',
      type: '*',
      plug: 'output',
      index: 2
    });
    expect(ports[3]).toEqual({
      name: 'p2b',
      type: '*',
      plug: 'output',
      index: 3
    });
    expect(ports[4]).toEqual({
      name: 'p3',
      type: '*',
      plug: 'output',
      index: 4
    });
  });

  xit('can react to channel changes', function () {
    ProjectModel.instance.findNodeWithId('ER-1').setParameter('channel', 'channelA');
    ProjectModel.instance.findNodeWithId('ES-1').setParameter('channel', 'channelC');

    var ports = ProjectModel.instance.findNodeWithId('ER-1').getPorts();
    expect(ports.length).toBe(3);
    expect(ports[0].name).toBe('channel');
    expect(ports[0].type).toEqual({
      name: 'enum',
      enums: ['channelA', 'channelB', 'channelC'],
      allowEditOnly: true
    });
    expect(ports[1]).toEqual({
      name: 'p2',
      type: '*',
      plug: 'output',
      index: 1
    });
    expect(ports[2]).toEqual({
      name: 'p3',
      type: '*',
      plug: 'output',
      index: 2
    });
  });

  function getProject() {
    return {
      components: [
        {
          name: 'comp1',
          graph: {
            roots: [
              {
                type: 'Event Sender',
                id: 'ES-1',
                parameters: {
                  channel: 'channelA'
                },
                ports: [
                  {
                    name: 'p1',
                    type: '*',
                    plug: 'input'
                  },
                  {
                    name: 'p2',
                    type: '*',
                    plug: 'input'
                  }
                ]
              },
              {
                type: 'Event Receiver',
                id: 'ER-1'
              }
            ]
          }
        },

        {
          name: 'comp2',
          graph: {
            roots: [
              {
                type: 'Event Sender',
                id: 'ES-2',
                parameters: {
                  channel: 'channelA'
                },
                ports: [
                  {
                    name: 'p2',
                    type: '*',
                    plug: 'input'
                  },
                  {
                    name: 'p3',
                    type: '*',
                    plug: 'input'
                  }
                ]
              },

              {
                type: 'Event Sender',
                id: 'ES-3',
                parameters: {
                  channel: 'channelB'
                },
                ports: [
                  {
                    name: 'p3',
                    type: '*',
                    plug: 'input'
                  },
                  {
                    name: 'p4',
                    type: '*',
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

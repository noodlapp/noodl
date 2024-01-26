const handleEvent = require('./editormodeleventshandler').handleEvent;
const GraphModel = require('./models/graphmodel');
const NodeContext = require('./nodecontext');

describe('Component ports update when on the componentPortsUpdated event', ()=>{
    let graphModel;
    let nodeContext;

    beforeEach(async ()=>{
        nodeContext = new NodeContext();
        graphModel = new GraphModel();
        await graphModel.importComponentFromEditorData({
            id: 'component',
            name: 'testComponent',
            ports: [
                { name: "testInput1", plug: "input", type: 'string'},
                { name: "testInput2", plug: "input", type: 'string'},
                { name: "testOutput1", plug: "output", type: 'string'},
                { name: "testOutput2", plug: "output", type: 'string'}
            ]
        });
    });

    function updateAndMatchPorts(newInputPorts, newOutputPorts) {

        handleEvent(nodeContext, graphModel, {
            type: 'componentPortsUpdated',
            componentName: 'testComponent',
            ports: newInputPorts.concat(newOutputPorts)
        });

        const componentModel = graphModel.getComponentWithName('testComponent');
        const inputPorts = componentModel.getInputPorts();
        for(const port of newInputPorts) {
            expect(inputPorts.hasOwnProperty(port.name)).toBeTruthy();
            expect(inputPorts[port.name].type).toEqual(port.type);
        }
        expect(Object.keys(inputPorts).length).toBe(newInputPorts.length);

        const outputPorts = componentModel.getOutputPorts();
        for(const port of newOutputPorts) {
            expect(outputPorts.hasOwnProperty(port.name)).toBeTruthy();
            expect(outputPorts[port.name].type).toEqual(port.type);
        }
        expect(Object.keys(outputPorts).length).toBe(newOutputPorts.length);
    }

    test('Input ports are added', () => {
        updateAndMatchPorts([
            { name: "testInput1", plug: "input", type: 'string'},
            { name: "testInput2", plug: "input", type: 'string'},
        ],
       [
            {name: "testOutput1", plug: "output", type: 'string'}
        ]);
    });

    test('Input ports are removed', () => {
        updateAndMatchPorts([],
            [
                {name: "testOutput1", plug: "output", type: 'string'}
            ]);
    });

    test('Input port types are updated', () => {
        updateAndMatchPorts([
            { name: "testInput1", plug: "input", type: 'boolean'},
            { name: "testInput2", plug: "input", type: {name:'number'}}
        ],
        []);
    });

    test('Output ports are added', () => {
        updateAndMatchPorts([
                { name: "testInput1", plug: "input", type: 'string'}
            ],
            [
                {name: "testOutput1", plug: "output", type: 'string'},
                {name: "testOutput2", plug: "output", type: 'string'}
            ]);
    });

    test('Output ports are removed', () => {
        updateAndMatchPorts([
                { name: "testInput1", plug: "input", type: 'string'}
            ],
            [
            ]);
    });

    test('Output port types are updated', () => {
        updateAndMatchPorts([],
        [
            { name: "testOutput1", plug: "output", type: 'number'},
            { name: "testOutput2", plug: "output", type: {name:'boolean'}}
        ]);
    });
});

const NodeContext = require('./nodecontext');
const NodeDefinition = require('./nodedefinition');
const ComponentInstance = require('./nodes/componentinstance');
const { ComponentModel } = require('./models/componentmodel');

describe('NodeContext', ()=>{

    test("can detect cyclic updates", async () => {
        const testNodeDefinition = NodeDefinition.defineNode({
            name: 'Test Node',
            category: 'test',
            initialize() {this._internal.count = 0;},
            inputs: {
                input: {
                    set() {
                        this._internal.count++;
                        this.flagOutputDirty('output');
                    }
                }
            },
            outputs: {
                output: {type: 'number', get() {return Math.random()}}
            },
        })

        const context = new NodeContext();
        context.nodeRegister.register(testNodeDefinition);

        const componentModel = await ComponentModel.createFromExportData({
            name: 'testComponent',
            id: '1',
            nodes: [
                { id: '2', type: 'Test Node', parameters: {input: true}},
                { id: '3', type: 'Test Node'}
            ],
            connections: [
                {sourceId: '2', sourcePort: 'output', targetId: '3', targetPort: 'input'},
                {sourceId: '3', sourcePort: 'output', targetId: '2', targetPort: 'input'}
            ]
        });

        const componentInstance = new ComponentInstance(context);
        await componentInstance.setComponentModel(componentModel);

        context.update();

        expect(componentInstance.nodeScope.getNodeWithId('2')._internal.count).toBeGreaterThan(50);
        expect(componentInstance.nodeScope.getNodeWithId('3')._internal.count).toBeGreaterThan(50);
    });
});
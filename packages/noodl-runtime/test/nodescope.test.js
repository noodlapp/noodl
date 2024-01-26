const NodeScope = require('./nodescope');
const NodeContext = require('./nodecontext');
const NodeDefinition = require('./nodedefinition');
const { ComponentModel } = require('./models/componentmodel');
const GraphModel = require('./models/graphmodel');

function createTestNodeDefinition({onInit, onDelete}) {
    return NodeDefinition.defineNode({
        name: 'Test Node',
        category: 'test',
        initialize() {
            this.children = [];
            onInit && onInit.call(this);
            onDelete && this.addDeleteListener(onDelete);
        },
        methods: {
            addChild(child) {
                this.children.push(child);
            },
            removeChild(child) {
                this.children.splice(this.children.indexOf(child), 1);
            },
            getChildren() {
                return this.children;
            }
        }
    });
}

//Create a graph that includes a two levels of component children
async function createTestRootComponent(args) {
    const context = new NodeContext();

    context.nodeRegister.register(createTestNodeDefinition(args || {}));

    const graph = new GraphModel();

    graph.on("componentAdded", component => context.registerComponentModel(component) );

    await graph.importEditorData( {
        components: [
            {
                name: 'rootComponent',
                nodes: [ {
                     id: 'test-component',
                     type: 'testComponent',
                     children: [
                         { id: 'test-node-from-root', type: 'Test Node' },
                         {
                             id: 'test-component-child',
                             type: 'testComponent',
                             children: [
                                { id: 'test-node-in-component-child', type: 'Test Node' },
                             ]
                        }
                    ]
                } ],
            },
            {
                name: 'testComponent',
                nodes: [ { 
                    id: 'test-node',
                    type: 'Test Node',
                    children: [
                        {
                            id: 'test-node-child',
                            type: 'Test Node',
                            children: [{id: 'component-children', type: 'Component Children'}]
                        }
                    ]
                } ],
            }
        ]
    });

    const rootComponent = await context.createComponentInstanceNode("rootComponent");
    context.setRootComponent(rootComponent);

    return rootComponent;
}

test('find nodes by id', async () => {
    const nodeScope = (await createTestRootComponent()).nodeScope;

    expect(nodeScope.hasNodeWithId('test-component')).toBe(true);

    const testComponent = nodeScope.getNodeWithId('test-component');
    expect(testComponent.nodeScope.hasNodeWithId('test-node')).toBe(true);
});

test('delete component', async () => {
    const nodeScope = (await createTestRootComponent()).nodeScope;

    nodeScope.deleteNode(nodeScope.getNodeWithId('test-component'));
    expect(nodeScope.hasNodeWithId('test-node')).toBe(false);
});

test('delete hierarchy', async () => {
    let testNodeCount = 0;
    const testComponent = await createTestRootComponent({
        onInit: () => testNodeCount++,
        onDelete: () => testNodeCount--
    });

    const nodeScope = testComponent.nodeScope.getNodeWithId('test-component').nodeScope;

    expect(testNodeCount).toBe(6);
    nodeScope.deleteNode(nodeScope.getNodeWithId('test-node'));
    expect(nodeScope.hasNodeWithId('test-node')).toBe(false);
    expect(nodeScope.hasNodeWithId('test-node-child')).toBe(false);
    expect(testNodeCount).toBe(3);
});

test('delete child in a component children hierarchy', async () => {
    let testNodeCount = 0;
    const testComponent = await createTestRootComponent({
        onInit: () => testNodeCount++,
        onDelete: () => testNodeCount--
    });
    const nodeScope = testComponent.nodeScope;

    expect(testNodeCount).toBe(6);
    expect(nodeScope.hasNodeWithId('test-node-from-root')).toBe(true);
    nodeScope.deleteNode(nodeScope.getNodeWithId('test-node-from-root'));
    expect(nodeScope.hasNodeWithId('test-node-from-root')).toBe(false);

    expect(testNodeCount).toBe(5);
});

test('delete component with component children', async () => {
    let testNodeCount = 0;
    const testComponent = await createTestRootComponent({
        onInit: () => testNodeCount++,
        onDelete: () => testNodeCount--
    });
    const nodeScope = testComponent.nodeScope;

    expect(testNodeCount).toBe(6);
    const node = nodeScope.getNodeWithId('test-component-child');
    nodeScope.deleteNode(node);
    expect(testNodeCount).toBe(3);
});

test('delete entire scope and nested scopes', async () => {

    let testNodeCount = 0;

    const testComponent = await createTestRootComponent({
        onInit: () => testNodeCount++,
        onDelete: () => testNodeCount--
    });
    const nodeScope = testComponent.nodeScope;

    expect(testNodeCount).toBe(6);
    nodeScope.reset();
    expect(testNodeCount).toBe(0);
});

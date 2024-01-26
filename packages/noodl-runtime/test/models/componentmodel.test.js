const { ComponentModel } = require('./componentmodel');
const NodeModel = require('./nodemodel');

test('Returns all nodes in the component', ()=>{
   const component = new ComponentModel('testComponent');

   component.addNode(new NodeModel('id1', 'testNode'));
   let nodes = component.getAllNodes();
   expect(nodes.length).toBe(1);
   expect(nodes[0].id).toBe('id1');

   component.addNode(new NodeModel('id2', 'testNode'));
   nodes = component.getAllNodes();
   expect(nodes.length).toBe(2);

   //the order is not guaranteed, so let's just use find
   expect(nodes.find(n=>n.id==='id1')).not.toBe(undefined);
   expect(nodes.find(n=>n.id==='id2')).not.toBe(undefined);
});

test('Connections can be added', ()=>{
   const component = new ComponentModel('testComponent');
   component.addNode(new NodeModel('id1', 'testNode'));
   component.addNode(new NodeModel('id2', 'testNode'));
   component.addConnection({
      sourceId: 'id1',
      sourcePort: 'test',
      targetId: 'id2',
      targetPort: 'test'
   });

   const connections = component.getConnectionsFrom('id1');
   expect(connections.length).toBe(1);
});

test('Connections can be removed', ()=>{
   const connection = {
      sourceId: 'id1',
      sourcePort: 'test',
      targetId: 'id2',
      targetPort: 'test'
   };

   const component = new ComponentModel('testComponent');
   component.addNode(new NodeModel('id1', 'testNode'));
   component.addNode(new NodeModel('id2', 'testNode'));
   component.addConnection(connection);
   //test with a copy of the object, and not the same object, to verify it works then as well
   component.removeConnection(JSON.parse(JSON.stringify(connection)));
   expect(component.getAllConnections().length).toBe(0);
});

test('Removing non-existing connection should not throw', ()=>{
   const connection = {
      sourceId: 'id1',
      sourcePort: 'test',
      targetId: 'id2',
      targetPort: 'test'
   };

   const component = new ComponentModel('testComponent');
   component.addNode(new NodeModel('id1', 'testNode'));
   component.addNode(new NodeModel('id2', 'testNode'));
   component.addConnection(connection);
   expect(()=>component.removeConnection({})).not.toThrow();
   expect(component.getAllConnections().length).toBe(1);
});
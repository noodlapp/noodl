import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { NodeLibraryImporter } from '@noodl-models/nodelibrary/NodeLibraryImporter';
import { getNodeGraphNodeRuntimeType } from '@noodl-utils/NodeGraph';

import { EventDispatcher } from '../../../shared/utils/EventDispatcher';
import { ViewerConnection } from '../ViewerConnection';

export class ConnectionInspector {
  public static instance: ConnectionInspector = new ConnectionInspector();

  public getConnectionValue(node: NodeGraphNode, type: 'input' | 'output', property: string, timeout = 250) {
    return new Promise((resolve, reject) => {
      const runtimeType = getNodeGraphNodeRuntimeType(node);
      const clients = NodeLibraryImporter.instance.clientsWithRuntime(runtimeType);
      if (clients.length === 0) {
        return reject('no available client');
      }

      const connection = node
        .getConnectionsOnThisNode()
        .find(
          (x) => (type === 'input' && x.toProperty === property) || (type === 'output' && x.fromProperty === property)
        );

      const connectionId =
        type === 'input'
          ? `${connection.fromId}${connection.fromProperty}`
          : `${connection.toId}${connection.toProperty}`;

      const group = {};

      const timeoutHandler = setTimeout(() => {
        EventDispatcher.instance.off(group);
        reject('timeout');
      }, timeout);

      EventDispatcher.instance.on(
        'ConnectionInspector',
        (data) => {
          if (data.connectionId === connectionId) {
            clearTimeout(timeoutHandler);
            resolve(data.value);
            EventDispatcher.instance.off(group);
          }
        },
        group
      );

      // NOTE: Pick the first client hoping that is the editor preview
      ViewerConnection.instance.sendGetConnectionValue(clients[0], connectionId);
    });
  }
}

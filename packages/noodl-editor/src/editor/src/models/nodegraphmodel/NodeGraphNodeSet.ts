import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { guid } from '@noodl-utils/utils';

export interface NodeGraphNodeSetOptions {
  nodes: NodeGraphNode[];
  connections: TSFixme;
  comments?: TSFixme;
}

export class NodeGraphNodeSet {
  nodes: NodeGraphNode[];
  connections: TSFixme;
  comments: TSFixme;

  constructor(args: NodeGraphNodeSetOptions) {
    this.nodes = args.nodes;
    this.connections = args.connections;
    this.comments = args.comments || [];
  }

  static fromJSON(json) {
    const nodes = [];
    for (const i in json.nodes) nodes.push(NodeGraphNode.fromJSON(json.nodes[i]));

    return new NodeGraphNodeSet({ nodes: nodes, connections: json.connections, comments: json.comments });
  }

  clone() {
    // Clone all nodes
    const clones = [];
    for (var i in this.nodes) {
      clones.push(NodeGraphNode.fromJSON(this.nodes[i].toJSON()));
    }

    // Generate new IDs and remap
    const idMap = {};

    for (var i in clones) {
      clones[i].forEach(function (node) {
        idMap[node.id] = guid();
        node.id = idMap[node.id];
      });
    }

    // Clone all connections, and remap IDs
    const connections = [];
    for (var i in this.connections) {
      const c = this.connections[i];
      connections.push({
        fromId: idMap[c.fromId],
        fromProperty: c.fromProperty,
        toId: idMap[c.toId],
        toProperty: c.toProperty
      });
    }

    //clone comments with new IDs
    const commentClones = JSON.parse(JSON.stringify(this.comments));
    for (const comment of commentClones) {
      comment.id = guid();
    }

    return new NodeGraphNodeSet({ nodes: clones, connections, comments: commentClones });
  }

  toJSON() {
    const json = {
      nodes: [],
      connections: this.connections,
      comments: this.comments
    };

    for (const i in this.nodes) {
      json.nodes.push(this.nodes[i].toJSON());
    }

    return json;
  }

  // Remove unnecessary stuff for clipboard
  strip() {
    function _strip(nodes) {
      for (const i in nodes) {
        delete nodes[i].dynamicports;

        _strip(nodes[i].children);
      }
    }

    _strip(this.nodes);
  }

  //Moves the entire graph so the position of the top left node is x,y
  setOriginPosition(newOrigin: { x: number; y: number }) {
    const origin = this.getOriginPosition();

    const nodesAndComments = this.nodes.concat(this.comments);

    for (const n of nodesAndComments) {
      n.x = Math.round(n.x - origin.x + newOrigin.x);
      n.y = Math.round(n.y - origin.y + newOrigin.y);
    }
  }

  //get position of top left node
  getOriginPosition(): { x: number; y: number } {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;

    const nodesAndComments = this.nodes.concat(this.comments);

    for (const n of nodesAndComments) {
      if (n.x < minX) {
        minX = n.x;
      }
      if (n.y < minY) {
        minY = n.y;
      }
    }

    return { x: minX, y: minY };
  }
}

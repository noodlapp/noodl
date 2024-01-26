import { NodeGraphColors } from '@noodl-constants/NodeGraphColors';
import { Connection } from '@noodl-models/nodegraphmodel';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import DebugInspector from '@noodl-utils/debuginspector';

import { IVector2, NodeGraphEditor } from '../nodegrapheditor';
import PopupLayer from '../popuplayer';
import { NodeGraphEditorNode } from './NodeGraphEditorNode';

function getPortName(p) {
  return p ? p.editorName || p.displayName : undefined;
}

function getPortIndex(p) {
  return p ? p.index || 0 : undefined;
}

export class NodeGraphEditorConnection {
  ctx: CanvasRenderingContext2D;
  owner: NodeGraphEditor;

  fromNode: any;
  toNode: any;
  fromPort: any;
  toPort: any;

  fromPlug: any;
  toPlug: any;

  model: Connection;
  curve: any;
  color: any;
  lineWidth: number | undefined;

  fromProperty: string;
  toProperty: string;

  constructor(model: Connection, ctx) {
    this.model = model;
    for (const i in model) this[i] = model[i];
    this.ctx = ctx;
  }

  static createFromModel(model: Connection, owner: NodeGraphEditor, ctx?: CanvasRenderingContext2D) {
    const con = new NodeGraphEditorConnection(model, ctx);

    con.fromNode = owner.findNodeWithId(model.fromId);
    con.toNode = owner.findNodeWithId(model.toId);
    con.owner = owner;
    con.connect(con);

    return con;
  }

  resolvePorts(args?) {
    this.fromPort = this.fromNode.model.getPort(this.fromProperty, 'output');
    this.toPort = this.toNode.model.getPort(this.toProperty, 'input');
  }

  connect(args) {
    this.fromNode = args.fromNode;
    this.toNode = args.toNode;
    this.fromProperty = args.fromProperty;
    this.toProperty = args.toProperty;

    this.resolvePorts();

    this.fromNode.connections.push(this);
    this.fromNode.sortConnections();

    this.toNode.connections.push(this);
    this.toNode.sortConnections();

    this.owner.connections.push(this);
  }

  disconnect() {
    let idx = this.fromNode.connections.indexOf(this);
    if (idx !== -1) this.fromNode.connections.splice(idx, 1);

    idx = this.toNode.connections.indexOf(this);
    if (idx !== -1) this.toNode.connections.splice(idx, 1);

    idx = this.owner.connections.indexOf(this);
    if (idx !== -1) this.owner.connections.splice(idx, 1);

    this.fromNode = this.toNode = undefined;
    this.fromProperty = this.toProperty = undefined;
  }

  getLocationRelativeTo(node) {
    const other = node === this.toNode ? this.fromNode : this.toNode;

    if (node.global.x < other.global.x - NodeGraphEditorNode.size.width * 1.1) {
      return 'left';
    } else if (other.global.x < node.global.x - NodeGraphEditorNode.size.width * 1.1) {
      return 'right';
    } else {
      return 'inline';
    }
  }

  getPropertyFor(node) {
    return node === this.fromNode ? this.fromProperty : this.toProperty;
  }

  getPortDisplayNameFor(node) {
    return node === this.fromNode ? getPortName(this.fromPort) : getPortName(this.toPort);
  }

  getPortIndexFor(node) {
    return node === this.fromNode ? getPortIndex(this.fromPort) : getPortIndex(this.toPort);
  }

  getPortGroupNameFor(node) {
    return node === this.fromNode
      ? this.fromPort
        ? this.fromPort.group
        : undefined
      : this.toPort
      ? this.toPort.group
      : undefined;
  }

  getDirectionFor(node) {
    return node === this.fromNode ? 'from' : 'to';
  }

  setPlugFor(node, plug) {
    if (node === this.fromNode) this.fromPlug = plug;
    else this.toPlug = plug;
  }

  isHighlighted() {
    return (
      (this.owner && this.owner.highlightedConnection === this) ||
      this.owner.isHighlighted(this.fromNode) ||
      this.owner.isHighlighted(this.toNode) ||
      this.owner.selector.isActive(this.fromNode) ||
      this.owner.selector.isActive(this.toNode)
    );
  }

  mouse(type, pos: IVector2, evt) {
    if (evt.button !== 0) return; //only interact with left mouse button

    const _this = this;
    if (type === 'move') {
      if (this.ctx) {
        this.ctx.lineWidth = 10;
        this.drawCurve();
        if (this.ctx.isPointInStroke(pos.x, pos.y)) {
          evt.consumed = true;
          this.owner.setHighlightedConnection(this, pos);

          // Show tooltip if the connection is unhealthy or has annotations
          if (this.owner.deleteModeConnection !== this) {
            // annotations takes priority over health
            if (this.model.annotation) {
              PopupLayer.instance.showTooltip({
                x: evt.pageX,
                y: evt.pageY,
                position: 'bottom',
                content: this.model.annotation
              });
            } else {
              const health = this.getHealth();
              if (!health.healthy) {
                PopupLayer.instance.showTooltip({
                  x: evt.pageX,
                  y: evt.pageY,
                  position: 'bottom',
                  content: health.message
                });
              }
            }
          }
          this.owner.repaint();
        } else if (this.owner.highlightedConnection === this) {
          this.owner.setHighlightedConnection(undefined);
          PopupLayer.instance.hideTooltip();
          this.owner.repaint();
        }
      }
    } else if (type === 'down' && this.owner.highlightedConnection === this) {
      evt.consumed = true;
    } else if (type === 'up' && this.owner.highlightedConnection === this) {
      PopupLayer.instance.hideTooltip();
      evt.consumed = true;

      if (this.model && this.owner.readOnly !== true) {
        // Don't do delete connection if in read only mode
        if (this.owner.deleteModeConnection === this) {
          // Connection is clicked the second time
          // Delete the connection
          this.owner.deleteModeConnection = undefined;
          this.owner.setHighlightedConnection(undefined);
          this.owner.removeConnection(this.model);
        } else {
          // Connection is clicked, turn it into a delete connection
          this.owner.deleteModeConnection = this;
          this.owner.repaint();

          // If nothing has happened in 3 seconds clear delete mode
          this.owner.clearDeleteModeTimer && clearTimeout(this.owner.clearDeleteModeTimer);
          this.owner.clearDeleteModeTimer = setTimeout(function () {
            if ((_this.owner.deleteModeConnection = _this)) {
              _this.owner.deleteModeConnection = undefined;
              _this.owner.repaint();
            }
          }, 3000);
        }
      }
    }
  }

  drawCurve() {
    const c = this.curve;
    if (!c) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(c[0].x, c[0].y);
    ctx.bezierCurveTo(c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y);
  }

  midpoint(a: IVector2, b: IVector2) {
    return { x: a.x * 0.5 + b.x * 0.5, y: a.y * 0.5 + b.y * 0.5 };
  }

  _bezierInterpolation(t, a, b, c, d) {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      a +
      (-a * 3 + t * (3 * a - a * t)) * t +
      (3 * b + t * (-6 * b + b * 3 * t)) * t +
      (c * 3 - c * 3 * t) * t2 +
      d * t3
    );
  }

  pointOnCurve(t) {
    const c = this.curve;
    if (!c) return;
    return {
      x: this._bezierInterpolation(t, c[0].x, c[1].x, c[2].x, c[3].x),
      y: this._bezierInterpolation(t, c[0].y, c[1].y, c[2].y, c[3].y)
    };
  }

  _findClosestPointOnCurve(p, t0, t1) {
    const thres = 0.05;
    const _t0 = t0 + (t1 - t0) * 0.25;
    const p0 = this.pointOnCurve(_t0);
    const pd0 = (p0.x - p.x) * (p0.x - p.x) + (p0.y - p.y) * (p0.y - p.y);

    const _t1 = t0 + (t1 - t0) * 0.75;
    const p1 = this.pointOnCurve(_t1);
    const pd1 = (p1.x - p.x) * (p1.x - p.x) + (p1.y - p.y) * (p1.y - p.y);

    if (Math.abs(t0 - t1) < thres) return t0 * 0.5 + t1 * 0.5;

    if (pd0 < pd1) return this._findClosestPointOnCurve(p, t0, t0 + (t1 - t0) * 0.5);
    else return this._findClosestPointOnCurve(p, t0 + (t1 - t0) * 0.5, t1);
  }

  findClosestPointOnCurve(p) {
    return this._findClosestPointOnCurve(p, 0, 1);
  }

  getHealth() {
    if (!this.owner) {
      return {
        healthy: true,
        message: undefined
      };
    }

    return this.owner.model.getConnectionHealth({
      sourceNode: this.fromNode ? this.fromNode.model : undefined,
      sourcePort: this.fromProperty,
      targetNode: this.toNode ? this.toNode.model : undefined,
      targetPort: this.toProperty
    });
  }

  isHealthy() {
    return this.getHealth().healthy;
  }

  paint(ctx, paintRect) {
    this.ctx = ctx;

    if (!this.fromPlug || !this.toPlug) return;

    const from = this.fromNode.global;
    const to = this.toNode.global;

    // This is a connection between two plugs, figure out the placement
    // of the connection
    const fy =
      from.y +
      this.fromNode.titlebarHeight() +
      this.fromPlug.index * NodeGraphEditorNode.propertyConnectionHeight +
      NodeGraphEditorNode.propertyConnectionHeight / 2 +
      NodeGraphEditorNode.verticalSpacing;
    const ty =
      to.y +
      this.toNode.titlebarHeight() +
      this.toPlug.index * NodeGraphEditorNode.propertyConnectionHeight +
      NodeGraphEditorNode.propertyConnectionHeight / 2 +
      NodeGraphEditorNode.verticalSpacing;

    const loc = this.getLocationRelativeTo(this.fromNode);
    if (loc === 'left') {
      var mid = to.x * 0.5 + (from.x + NodeGraphEditorNode.size.width) * 0.5;

      this.curve = [
        { x: from.x + this.fromNode.nodeSize.width, y: fy },
        { x: mid, y: fy },
        { x: mid, y: ty },
        { x: to.x, y: ty }
      ];
    } else if (loc === 'right') {
      var mid = (to.x + NodeGraphEditorNode.size.width) * 0.5 + from.x * 0.5;

      this.curve = [
        { x: from.x, y: fy },
        { x: mid, y: fy },
        { x: mid, y: ty },
        { x: to.x + this.toNode.nodeSize.width, y: ty }
      ];
    } else {
      const dx = Math.min(from.x, to.x) - (50 + Math.abs(to.y - from.y) * 0.2);

      this.curve = [
        { x: from.x, y: fy },
        { x: dx, y: fy },
        { x: dx, y: ty },
        { x: to.x, y: ty }
      ];
    }

    function aabbIntersectTest(connection, paintArea) {
      const minX = Math.min(connection[0].x, connection[1].x, connection[2].x, connection[3].x);
      const maxX = Math.max(connection[0].x, connection[1].x, connection[2].x, connection[3].x);
      const minY = Math.min(connection[0].y, connection[1].y, connection[2].y, connection[3].y);
      const maxY = Math.max(connection[0].y, connection[1].y, connection[2].y, connection[3].y);

      return !(minX > paintArea.maxX || maxX < paintArea.minX || minY > paintArea.maxY || maxY < paintArea.minY);
    }

    if (aabbIntersectTest(this.curve, paintRect) === false) {
      return;
    }

    if (!this.getHealth().healthy) {
      ctx.setLineDash([5]);
    }

    const hoverConnection = this.isHighlighted();
    const type = NodeLibrary.nameForPortType(this.fromPort ? this.fromPort.type : undefined);
    const connectionColors = NodeLibrary.instance.colorSchemeForConnectionType(type);

    const color = hoverConnection ? connectionColors.highlighted : connectionColors.normal;
    ctx.strokeStyle = this.color ? this.color : color;

    if (this.model.annotation) {
      if (this.model.annotation === 'Deleted') ctx.strokeStyle = '#F57569';
      else if (this.model.annotation === 'Changed') ctx.strokeStyle = '#83B8BA';
      else if (this.model.annotation === 'Created') ctx.strokeStyle = '#5BF59E';
    }

    const lineWidth = 1.5;
    ctx.lineWidth = this.lineWidth ? this.lineWidth : lineWidth;

    this.drawCurve();
    ctx.stroke();

    if (DebugInspector.instance.isEnabled() && DebugInspector.instance.isConnectionPulsing(this)) {
      const t = DebugInspector.instance.getPulseAnimationState(this);
      ctx.strokeStyle = connectionColors.pulsing ? connectionColors.pulsing : '#ffe85d';
      ctx.setLineDash([5, 15]);
      ctx.lineDashOffset = -t.offset;
      ctx.globalAlpha = t.opacity * 0.7;
      this.drawCurve();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.lineDashOffset = 0;
    ctx.setLineDash([]); // Restore line dash if it has been previously set

    // Show the delete marker
    if (this.owner && this.owner.deleteModeConnection === this) {
      const a = this.midpoint(this.curve[0], this.curve[1]),
        b = this.midpoint(this.curve[1], this.curve[2]),
        c = this.midpoint(this.curve[2], this.curve[3]);

      const mp = this.midpoint(this.midpoint(a, b), this.midpoint(b, c));
      ctx.fillStyle = NodeGraphColors.red;
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, 6, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = NodeGraphColors.base2;
      ctx.beginPath();
      const l = 2.5;
      ctx.moveTo(mp.x - l, mp.y - l);
      ctx.lineTo(mp.x + l, mp.y + l);
      ctx.moveTo(mp.x + l, mp.y - l);
      ctx.lineTo(mp.x - l, mp.y + l);
      ctx.stroke();
    }
  }
}

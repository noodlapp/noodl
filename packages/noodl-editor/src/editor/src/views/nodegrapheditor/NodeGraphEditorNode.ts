import _ from 'underscore';

import { AiAssistantModel } from '@noodl-models/AiAssistant';
import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';

import { NodeLibrary } from '../../models/nodelibrary';
import { ProjectModel } from '../../models/projectmodel';
import { ViewerConnection } from '../../ViewerConnection';
import { NodeGraphEditor } from '../nodegrapheditor';
import PopupLayer from '../popuplayer';
import { NodeGraphEditorConnection } from './NodeGraphEditorConnection';

function _getColorForAnnotation(annotation) {
  if (annotation === 'Deleted') return '#F57569';
  else if (annotation === 'Changed') return '#83B8BA';
  else if (annotation === 'Created') return '#5BF59E';
}

function measureTextHeight(text, font, lineHeight, maxWidth) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  ctx.font = font;
  ctx.textBaseline = 'top';

  return textWordWrap(ctx, text, 0, 0, lineHeight, maxWidth);
}

function textWordWrap(context, text, x, y, lineHeight, maxWidth, cb?) {
  if (!text) return;

  let words = text.split(' ');
  let currentLine = 0;
  let idx = 1;
  while (words.length > 0 && idx <= words.length) {
    const str = words.slice(0, idx).join(' ');
    const w = context.measureText(str).width;
    if (w > maxWidth) {
      if (idx == 1) {
        idx = 2;
      }
      cb && cb(words.slice(0, idx - 1).join(' '), x, y + lineHeight * currentLine);
      currentLine++;
      words = words.splice(idx - 1);
      idx = 1;
    } else {
      idx++;
    }
  }
  if (idx > 0) {
    cb && cb(words.slice(0, idx - 1).join(' '), x, y + lineHeight * currentLine);
  }

  return lineHeight * currentLine + lineHeight;
}

function nodeShouldAttach(root, mousePos, nodesToAttach) {
  const potentialAttachPoints = [];

  //Gather a list of potential positions to do the drop at
  //Start with the root and recurse down
  _nodeShouldAttachRecurse(mousePos, root, nodesToAttach, potentialAttachPoints);

  // window._debugNodeGraphAttachPoints = potentialAttachPoints;

  if (potentialAttachPoints.length === 0) {
    return;
  }

  function distSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  //find closest attach point
  let index = 0;
  let minDist = distSquared(mousePos, potentialAttachPoints[0].anchorPoint);
  for (let i = 1; i < potentialAttachPoints.length; i++) {
    const d = distSquared(mousePos, potentialAttachPoints[i].anchorPoint);
    if (d < minDist) {
      minDist = d;
      index = i;
    }
  }

  return potentialAttachPoints[index].attachInfo;
}

//There are 4 different valid locations to drop a node in a hierarchy:
//1. Directly at the parent, node will be added as last child
//2. In the space directly above a node. Node will become a sibling
//3. In the space directly below a node. Node will become a sibling
//4. In the space directly below a node, but offset a bit to the right. Node will become first child
//5. In the space below a node subgraph, offset a bit to the right. Node will become last child
function _nodeShouldAttachRecurse(pos, node, nodesToAttach, result) {
  const hitPadding = 10;

  const { x, y } = node.global;

  const hierarchyHeight = node.measure().height;
  const { width, height } = node.nodeSize;

  const intersectX = pos.x >= x - hitPadding && pos.x <= x + width + hitPadding;
  const intersectY = pos.y >= y - hitPadding && pos.y <= y + height + hitPadding;

  const nodeCanAcceptChildNodes = canAcceptChildNodes(node, nodesToAttach);

  //1. Directly at the parent, node will be added as last child
  if (intersectX && intersectY && nodeCanAcceptChildNodes) {
    result.push(getAttachPointOnNode(node));
  }

  if (intersectX && node.parent && canAcceptChildNodes(node.parent, nodesToAttach)) {
    //2. In the space directly above a node. Node will become a sibling
    if (pos.y >= y - NodeGraphEditorNode.childSpacing + hitPadding && pos.y <= y + height / 2 + hitPadding) {
      result.push(getAttachPointAboveNode(node));
    }

    //3. In the space directly below a node. Node will become a sibling.
    //The hit areas are slightly different depending on if the node has children:
    // - No children: hit area starts at the middle of the node
    // - Children: hit area starts after last child
    const hasChildren = node.children.length > 0;
    if (
      hasChildren &&
      pos.y >= y + hierarchyHeight - hitPadding &&
      pos.y <= y + hierarchyHeight + NodeGraphEditorNode.childSpacing + hitPadding
    ) {
      result.push(getAttachPointBelowNode(node));
    } else if (
      !hasChildren &&
      pos.y >= y + height / 2 - hitPadding &&
      pos.y <= y + height + NodeGraphEditorNode.childSpacing + hitPadding
    ) {
      result.push(getAttachPointBelowNode(node));
    }
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (pos.y >= child.global.y - hitPadding) {
      _nodeShouldAttachRecurse(pos, child, nodesToAttach, result);
    }
  }

  //4. In the space directly below a node, but offset a bit to the right. Node will become first child
  if (
    nodeCanAcceptChildNodes &&
    pos.x >= x - hitPadding &&
    pos.x <= x + node.nodeSize.width + NodeGraphEditorNode.childMargin + hitPadding &&
    pos.y >= y + node.nodeSize.height - hitPadding &&
    pos.y <= y + node.nodeSize.height + NodeGraphEditorNode.childSpacing + hitPadding
  ) {
    result.push(getAttachPointBelowRightNode(node));
  }

  //5. In the space below a node subgraph, offset a bit to the right. Node will become last child
  if (
    node.children.length &&
    nodeCanAcceptChildNodes &&
    pos.x >= x - hitPadding &&
    pos.x <= x + node.nodeSize.width + NodeGraphEditorNode.childMargin + hitPadding &&
    pos.y >= y + hierarchyHeight - hitPadding &&
    pos.y <= y + hierarchyHeight + NodeGraphEditorNode.childSpacing + hitPadding
  ) {
    result.push(getAttachPointBelowRightSubgraph(node));
  }
}

function canAcceptChildNodes(node, nodes) {
  return node.model.canAcceptChildren(_.pluck(nodes, 'model'));
}

function getAttachPointBelowRightNode(node) {
  const { x, y } = node.global;

  return {
    anchorPoint: {
      x: x + node.nodeSize.width / 2 + NodeGraphEditorNode.childMargin,
      y: y + node.nodeSize.height + NodeGraphEditorNode.childSpacing / 2
    },
    attachInfo: {
      parent: node,
      index: 0,
      pos: {
        x: x + NodeGraphEditorNode.childMargin,
        y: y + node.nodeSize.height
      }
    }
  };
}

function getAttachPointOnNode(node) {
  const { x, y } = node.global;

  const hierarchyHeight = node.measure().height;

  return {
    anchorPoint: {
      x: x + node.nodeSize.width / 2,
      y: y + node.nodeSize.height / 2
    },
    attachInfo: {
      parent: node,
      index: node.children.length,
      pos: {
        x: x + NodeGraphEditorNode.childMargin,
        y: y + hierarchyHeight
      }
    }
  };
}

function getAttachPointBelowRightSubgraph(node) {
  const { x, y } = node.global;

  const hierarchyHeight = node.measure().height;

  return {
    anchorPoint: {
      x: x + node.nodeSize.width / 2 + NodeGraphEditorNode.childMargin,
      y: y + hierarchyHeight + NodeGraphEditorNode.childSpacing / 2
    },
    attachInfo: {
      parent: node,
      index: node.children.length,
      pos: {
        x: x + NodeGraphEditorNode.childMargin,
        y: y + hierarchyHeight
      }
    }
  };
}

function getAttachPointAboveNode(node) {
  const { x, y } = node.global;

  const parent = node.parent;
  const index = parent.children.indexOf(node);

  return {
    anchorPoint: {
      x: x + node.nodeSize.width / 2,
      y: y - NodeGraphEditorNode.childSpacing / 2
    },
    attachInfo: {
      parent,
      index: index,
      pos: {
        x: x,
        y: y - NodeGraphEditorNode.childSpacing
      }
    }
  };
}

function getAttachPointBelowNode(node) {
  const { x, y } = node.global;

  const parent = node.parent;
  const index = parent.children.indexOf(node);

  const hierarchyHeight = node.measure().height;

  return {
    anchorPoint: {
      x: x + node.nodeSize.width / 2,
      y: y + hierarchyHeight + NodeGraphEditorNode.childSpacing / 2
    },
    attachInfo: {
      parent,
      index: index + 1,
      pos: {
        x: x,
        y: y + hierarchyHeight
      }
    }
  };
}

export class NodeGraphEditorNode {
  public static readonly size = { width: 150, height: 36 };
  public static readonly childMargin = 20;
  public static readonly childSpacing = 10;
  public static readonly borderSize = 7;
  public static readonly attachedThreshold = 20;
  public static readonly propertyConnectionHeight = 20;
  public static readonly verticalSpacing = 8;

  model: NodeGraphNode;
  x: number;
  y: number;
  global: { x: number; y: number };
  id: string;
  children: NodeGraphEditorNode[];
  connections: NodeGraphEditorConnection[];
  nodeSize: { width: number; height: number };
  owner: NodeGraphEditor;
  parent: NodeGraphEditorNode;
  isTrackingMove: TSFixme;
  borderHighlighted: boolean;
  connectionDragAreaHighlighted: boolean;
  _cachedLabelHeightTextKey: string;
  _cachedLabelHeight: number;
  _cachedSublabelHeightText: string;
  _cachedSublabelHeight: number;
  selected: boolean;
  measuredSize: TSFixme;
  plugs: TSFixme[];

  icon: HTMLImageElement;
  rotatingIcon: HTMLImageElement;
  iconSize: number;
  iconRotation: number;

  constructor(model) {
    this.model = model;
    this.x = model.x || 0;
    this.y = model.y || 0;
    this.global = { x: 0, y: 0 };
    this.id = model.id;
    this.children = [];
    this.connections = [];
    this.nodeSize = NodeGraphEditorNode.size;
    this.iconRotation = 0;
    this.bindModel();

    return this;
  }

  static createFromModel(model, owner, parent?) {
    const node = new NodeGraphEditorNode(model);

    node.owner = owner;
    node.parent = parent;

    _.each(model.children, function (child) {
      node.children.push(NodeGraphEditorNode.createFromModel(child, owner, node));
    });

    return node;
  }

  updateIcon() {
    const health = this.model.getHealth();
    this.iconSize = 18;
    this.rotatingIcon = null;

    if (!health.healthy) {
      this.icon = this.owner?.warningIcon;
    } else if (this.model.type instanceof ComponentModel && this.owner?.componentIcon) {
      this.icon = this.owner?.componentIcon;
    } else if (this.id === ProjectModel.instance.getRootNode()?.id) {
      this.icon = this.owner?.homeIcon;
    } else if (this.model.metadata?.AiAssistant) {
      this.icon = this.owner?.aiAssistantInnerIcon;
      this.rotatingIcon = this.owner?.aiAssistantOuterIcon;
      this.iconSize = 25;
      if (AiAssistantModel.instance.getProcessingNodeIds().includes(this.id)) {
        this.iconRotation = performance.now() / 400;
      } else {
        this.iconRotation = 0;
      }
    } else {
      this.icon = undefined;
    }
  }

  bindModel() {
    const _this = this;
    this.model.on(
      'change',
      function (args) {
        _this.owner.relayout();
        _this.owner.repaint();
      },
      this
    );

    this.model.on(
      'instancePortsChanged',
      function () {
        _this.connections.forEach(function (c) {
          c.resolvePorts();
        });
        _this.owner.relayout();
        _this.owner.repaint();
      },
      this
    );
  }

  destruct() {
    this.model.off(this);

    for (const child of this.children) {
      child.destruct();
    }
  }

  updateModel() {
    this.model.set({ x: this.x, y: this.y });
  }

  forEach(callback: (child: NodeGraphEditorNode) => boolean) {
    if (callback(this)) {
      return true;
    }
    for (const i in this.children) {
      if (this.children[i].forEach(callback)) {
        return false;
      }
    }
  }

  pointInside(pos) {
    const bw = NodeGraphEditorNode.borderSize;
    const inside =
      pos.x >= this.x - bw &&
      pos.x <= this.x + this.nodeSize.width + bw &&
      pos.y >= this.y - bw &&
      pos.y <= this.y + this.nodeSize.height + bw;

    return inside;
  }

  propagateMouse(type, pos, evt) {
    // Propagate mouse event to children
    for (const child of this.children) {
      child.propagateMouse(type, { x: pos.x - this.x, y: pos.y - this.y }, evt);
    }

    // Enlarge the hit area with the border size
    if (this.pointInside(pos) && type !== 'out') {
      if (type === 'move' && !this.isTrackingMove) {
        // If this is a move event and this node is not tracking move events
        // generate a move in first
        this.mouse('move-in', { x: pos.x - this.x, y: pos.y - this.y }, evt);
        this.isTrackingMove = true;
      }
      this.mouse(type, { x: pos.x - this.x, y: pos.y - this.y }, evt);
    } else if (this.isTrackingMove) {
      // The mouse exited the node, if it was tracking generate a move out event
      this.isTrackingMove = false;
      this.mouse('move-out', { x: pos.x - this.x, y: pos.y - this.y }, evt);
    }
  }

  mouse(type, pos, evt) {
    if (evt.button !== 0) return; //only interact with left mouse button

    evt.consumed = true;

    switch (type) {
      case 'move':
      case 'move-in':
        // Is the mouse hovering the border or body of the node?
        var bw = NodeGraphEditorNode.borderSize;
        if (pos.x < bw || pos.x > this.nodeSize.width - bw || pos.y < bw || pos.y > this.nodeSize.height - bw) {
          this.borderHighlighted = true;
        } else {
          this.borderHighlighted = false;
        }

        // Send node highlighted to viewer if this node is being highligted
        if (!this.borderHighlighted) ViewerConnection.instance.sendNodeHighlighted(this.model, true);

        this.owner.setHighlightedNode(this, pos);

        // Show tooltop if this node is annotated
        if (this.model.annotation) {
          PopupLayer.instance.showTooltip({
            x: evt.pageX,
            y: evt.pageY,
            position: 'bottom',
            content: this.model.annotation
          });
        } else {
          // Show tooltip if the connection is unhealthy
          const health = this.model.getHealth();
          if (!health.healthy) {
            PopupLayer.instance.showTooltip({
              x: evt.pageX,
              y: evt.pageY,
              position: 'bottom',
              content: health.message
            });
          }
        }

        this.connectionDragAreaHighlighted = pos.x > this.nodeSize.width - 20 && pos.y < 20;

        const showCrosshairCursor = this.connectionDragAreaHighlighted || this.borderHighlighted;
        this.owner.el.css({
          cursor: showCrosshairCursor ? 'crosshair' : 'initial'
        });

        this.owner.repaint();
        break;
      case 'move-out':
        PopupLayer.instance.hideTooltip();

        this.owner.el.css({ cursor: 'initial' });

        // Clear highlight on move out
        if (this.owner.highlighted === this) {
          this.owner.setHighlightedNode(undefined);
        }

        this.connectionDragAreaHighlighted = false;
        this.borderHighlighted = false;
        this.owner.repaint();

        ViewerConnection.instance.sendNodeHighlighted(this.model, false);
        break;
      case 'down':
        PopupLayer.instance.hideTooltip();

        if (this.owner.highlighted === this) {
          if (this.borderHighlighted || this.connectionDragAreaHighlighted) {
            // User starts dragging from the border or connection area with circle icon
            this.owner.startDraggingConnection(this);
          } else {
            if (evt.shiftKey) {
              this.owner.addNodeToSelection(this);
            } else {
              this.owner.startDraggingNode(this);
            }
          }
        }
        break;
      case 'up':
        {
          const hasModifierKey = evt.metaKey || evt.ctrlKey || evt.shiftKey;
          if (!hasModifierKey) {
            this.owner.selectNode(this);
          }
        }
        break;
    }
  }

  isProjectRoot() {
    return ProjectModel.instance.getRootNode() === this.model;
  }

  isComponent() {
    return this.model.type instanceof ComponentModel;
  }

  titlebarLabelHeight() {
    const cacheKey = this.model.label + (this.icon ? 'icon' : '');
    if (cacheKey !== this._cachedLabelHeightTextKey) {
      const connectionDragAreaWidth = 10;
      const horizontalSpacing = 10;

      const iconOffset = this.icon ? 12 : 0;

      const maxWidth = this.nodeSize.width - 2 * horizontalSpacing - connectionDragAreaWidth - iconOffset;

      this._cachedLabelHeight = measureTextHeight(this.model.label, '12px Inter-Regular', 14, maxWidth);
      this._cachedLabelHeightTextKey = cacheKey;
    }

    return this._cachedLabelHeight;
  }

  titlebarSublabelHeight() {
    if (this.typeDisplayName() !== this._cachedSublabelHeightText) {
      const connectionDragAreaWidth = 10;
      const horizontalSpacing = 10;
      const maxWidth = this.nodeSize.width - 2 * horizontalSpacing - connectionDragAreaWidth;

      this._cachedSublabelHeight = measureTextHeight(this.typeDisplayName(), '12px Inter-Regular', 14, maxWidth);
      this._cachedSublabelHeightText = this.typeDisplayName();
    }

    return this._cachedSublabelHeight;
  }

  titlebarHeight() {
    const labelExtraHeight = this.model.label !== this.typeDisplayName() ? this.titlebarSublabelHeight() : 0;
    return this.titlebarLabelHeight() + labelExtraHeight + 22;
  }

  typeDisplayName() {
    return this.model.metadata?.typeLabelOverride || this.model.type.displayName;
  }

  paint(ctx: CanvasRenderingContext2D, paintRect, options?) {
    const _this = this;

    const x = this.global.x;
    const y = this.global.y;

    const isOutsidePaintArea =
      x > paintRect.maxX ||
      y > paintRect.maxY ||
      x + this.nodeSize.width < paintRect.minX ||
      y + this.nodeSize.height < paintRect.minY;

    if (isOutsidePaintArea === false) {
      this.updateIcon();
      const nc = this.model.metadata?.colorOverride
        ? NodeLibrary.instance.colorSchemeForNodeColorName(this.model.metadata.colorOverride)
        : NodeLibrary.instance.colorSchemeForNodeType(this.model.type);

      const isHighligthed = this.owner.isHighlighted(this);
      const horizontalSpacing = 10,
        connectionDragAreaWidth = 10; //the circle icon where you can drag connection from

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.save();

      // Clip
      ctx.beginPath();
      ctx.rect(x, y, this.nodeSize.width, this.nodeSize.height);
      ctx.clip();

      // Bg
      ctx.fillStyle = nc.header;
      ctx.fillRect(x, y, this.nodeSize.width, this.nodeSize.height);

      const titlebarHeight = this.titlebarHeight();

      // Darken plate
      //ctx.globalAlpha = 0.07;
      ctx.fillStyle = nc.base;
      ctx.fillRect(x, y + titlebarHeight, this.nodeSize.width, this.nodeSize.height - titlebarHeight);

      // Highlight plate
      if (isHighligthed || this.selected) {
        const prevCompOperation = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'hard-light'; // additive blending looks better
        ctx.globalAlpha = 0.19;
        ctx.fillStyle = nc.text;
        ctx.fillRect(x, y, this.nodeSize.width, this.nodeSize.height);
        ctx.globalCompositeOperation = prevCompOperation;
        ctx.globalAlpha = 1;
      }

      if (this.icon) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const offset = Math.abs(this.iconSize - 18);

        ctx.drawImage(
          this.icon,
          x + horizontalSpacing + this.nodeSize.width - horizontalSpacing - connectionDragAreaWidth - 16 - offset,
          y + NodeGraphEditorNode.verticalSpacing + 1 - offset / 2,
          this.iconSize,
          this.iconSize
        );

        if (this.rotatingIcon) {
          ctx.save();
          ctx.translate(
            x +
              horizontalSpacing +
              this.nodeSize.width -
              horizontalSpacing -
              connectionDragAreaWidth -
              16 -
              offset +
              this.iconSize / 2,
            y + NodeGraphEditorNode.verticalSpacing + 1 - offset / 2 + this.iconSize / 2
          );
          ctx.rotate(this.iconRotation);
          ctx.drawImage(this.rotatingIcon, -this.iconSize / 2, -this.iconSize / 2, this.iconSize, this.iconSize);

          ctx.restore();
        }
      }

      const iconOffset = this.icon ? 12 : 0;

      const hasUserLabel = this.typeDisplayName() && this.model.label !== this.typeDisplayName();

      // Title
      ctx.fillStyle = nc.text;

      ctx.font = '12px Inter-Regular';
      ctx.textBaseline = 'top';
      textWordWrap(
        ctx,
        this.model.label,
        x + horizontalSpacing,
        y + NodeGraphEditorNode.verticalSpacing + 5,
        14,
        this.nodeSize.width - 2 * horizontalSpacing - connectionDragAreaWidth - iconOffset,
        (text, x, y) => ctx.fillText(text, x, y)
      );

      //If this node has a label set by the user, render the type name as a sub label
      if (hasUserLabel) {
        ctx.save();
        ctx.fillStyle = nc.text;
        ctx.globalAlpha = 0.65;
        ctx.font = '12px Inter-Regular';
        ctx.textBaseline = 'top';
        textWordWrap(
          ctx,
          this.typeDisplayName(),
          x + horizontalSpacing,
          y + this.titlebarLabelHeight() + 14,
          14,
          this.nodeSize.width - 2 * horizontalSpacing - connectionDragAreaWidth,
          (text, x, y) => ctx.fillText(text, x, y)
        );
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      ctx.restore(); // Restore clip so we can draw border

      if (isHighligthed) {
        ctx.fillStyle = this.borderHighlighted ? '#ffffff' : nc.text;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x + this.nodeSize.width, y + titlebarHeight / 2, 4, 0, 2 * Math.PI, false);
        ctx.fill();

        // ctx.font = '10px FontAwesome';

        // ctx.fillText(
        //   // @ts-expect-error
        //   String.fromCharCode('0xf111'),
        //   x + this.nodeSize.width - 5,
        //   y + titlebarHeight / 2
        // );
      }

      // Border
      const health = this.model.getHealth();
      if (!health.healthy) {
        ctx.setLineDash([5]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#F57569';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.rect(x - 1, y - 1, this.nodeSize.width + 2, this.nodeSize.height + 2);
        ctx.stroke();
        ctx.setLineDash([]); // Restore line dash
        ctx.globalAlpha = 1;
      }

      if (this.selected || this.borderHighlighted || this.connectionDragAreaHighlighted) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(x, y, this.nodeSize.width, this.nodeSize.height);
        ctx.stroke();
      }

      if (this.model.annotation) {
        if (this.model.annotation === 'Deleted') ctx.strokeStyle = '#F57569';
        else if (this.model.annotation === 'Changed') ctx.strokeStyle = '#83B8BA';
        else if (this.model.annotation === 'Created') ctx.strokeStyle = '#5BF59E';

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(x, y, this.nodeSize.width, this.nodeSize.height);
        ctx.stroke();
      }

      // Paint plugs
      let tx, ty;

      function arrow(side, color) {
        const dx = side === 'left' ? 4 : -4;
        const cx = x + (side === 'left' ? 0 : _this.nodeSize.width);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx - dx, ty - 4);
        ctx.lineTo(cx + dx, ty);
        ctx.lineTo(cx - dx, ty + 4);
        ctx.fill();
      }

      function dot(side, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + (side === 'left' ? 0 : _this.nodeSize.width), ty, 4, 0, 2 * Math.PI, false);
        ctx.fill();
      }

      function drawPlugs(plugs, offset) {
        ctx.font = '11px Inter-Regular';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;

        for (const i in plugs) {
          const p = plugs[i];

          // Label
          ty = p.index * NodeGraphEditorNode.propertyConnectionHeight + offset;

          if (p.loc === 'left' || p.loc === 'middle') tx = x + horizontalSpacing;
          else if (p.loc === 'right') tx = x + _this.nodeSize.width - horizontalSpacing;
          else tx = x + _this.nodeSize.width / 2;
          ctx.fillStyle = nc.text;
          ctx.textAlign = p.loc === 'right' ? 'right' : 'left';

          ctx.fillText(p.displayName ? p.displayName : p.property, tx, ty);

          // Plug
          if (p.leftCons.length) {
            var connectionColors = NodeLibrary.instance.colorSchemeForConnectionType(
              NodeLibrary.nameForPortType(p.leftCons[0].fromPort ? p.leftCons[0].fromPort.type : undefined)
            );
            var color = _.find(p.leftCons, function (p) {
              return p.isHighlighted();
            })
              ? connectionColors.highlighted
              : connectionColors.normal;

            var topConnection =
              _.find(p.leftCons, function (p) {
                return p.isHighlighted();
              }) || p.leftCons[p.leftCons.length - 1];

            if (topConnection.model.annotation) {
              color = _getColorForAnnotation(topConnection.model.annotation);
            }

            if (p.leftIcon === 'from') {
              dot('left', color);
            } else if (p.leftIcon === 'to' || p.leftIcon === 'both') {
              arrow('left', color);
            }
          }

          if (p.rightCons.length) {
            connectionColors = NodeLibrary.instance.colorSchemeForConnectionType(
              NodeLibrary.nameForPortType(p.rightCons[0].fromPort ? p.rightCons[0].fromPort.type : undefined)
            );
            color = _.find(p.rightCons, function (p) {
              return p.isHighlighted();
            })
              ? connectionColors.highlighted
              : connectionColors.normal;

            var topConnection =
              _.find(p.rightCons, function (p) {
                return p.isHighlighted();
              }) || p.rightCons[p.rightCons.length - 1];

            if (topConnection.model.annotation) {
              color = _getColorForAnnotation(topConnection.model.annotation);
            }

            if (p.rightIcon === 'from') {
              dot('right', color);
            } else if (p.rightIcon === 'to' || p.rightIcon === 'both') {
              arrow('right', color);
            }
          }
        }
      }

      // If there is only one 'Other' group, draw just plugs
      drawPlugs(
        this.plugs,
        y + titlebarHeight + NodeGraphEditorNode.propertyConnectionHeight / 2 + NodeGraphEditorNode.verticalSpacing
      );

      ctx.textBaseline = 'middle';
    }

    // Paint children
    if (!(options && options.dontPaintChildren)) {
      for (const i in this.children) {
        this.children[i].paint(ctx, paintRect);
      }
    }
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.global.x = x + (this.parent ? this.parent.global.x : 0);
    this.global.y = y + (this.parent ? this.parent.global.y : 0);
  }

  layout() {
    let y = this.nodeSize.height + NodeGraphEditorNode.childSpacing;
    _.each(this.children, function (child) {
      const size = child.measure();

      child.setPosition(NodeGraphEditorNode.childMargin, y);
      child.layout(); // Recurse to layout children

      y += size.height + NodeGraphEditorNode.childSpacing;
    });
  }

  sortConnections() {
    const _this = this;

    this.connections.sort(function (a, b) {
      return a.getPropertyFor(_this) < b.getPropertyFor(_this) ? -1 : 1;
    });
  }

  measure() {
    if (this.measuredSize) return this.measuredSize;

    if (!this.children) {
      this.measuredSize = NodeGraphEditorNode.size;
    } else {
      const size = {
        width: NodeGraphEditorNode.size.width,
        height: NodeGraphEditorNode.size.height
      };

      // Collect all connections into plugs and groups
      const plugs = (this.plugs = []);
      /*  var groups = this.plugGroups = {};
      function addPlugToGroup(p,group) {
        var name = group?group:'Other';
        if(!groups[name]) groups[name] = {name:name,leftCons:0,rightCons:0,plugs:[]};
        groups[name].plugs.push(p);
        return groups[name];
      }*/
      for (const i in this.connections) {
        const con = this.connections[i];
        const prop = con.getPropertyFor(this);
        const loc = con.getLocationRelativeTo(this) === 'left' ? 'right' : 'left';
        let p = plugs[plugs.length - 1];

        // Connections are sorted alphabetically, so if there are multiple connections
        // to this port they will be directly after each other in the array
        if (p && p.property === prop) {
          p.loc = p.loc === loc ? loc : 'middle'; // have connection on multiple side, center the plug
          con.setPlugFor(this, p);
        } else {
          plugs.push({
            property: prop,
            displayName: con.getPortDisplayNameFor(this),
            loc: loc,
            dir: con.getDirectionFor(this),
            leftCons: [],
            rightCons: [],
            index: con.getPortIndexFor(this)
          });
          p = plugs[plugs.length - 1];
          con.setPlugFor(this, p);
          //addPlugToGroup(p,con.getPortGroupNameFor(this));
        }

        // Store the connections based on where they are coming from
        if (loc === 'left') p.leftCons.push(con);
        else p.rightCons.push(con);

        // Set the icon for the left or right side of the plug
        p[loc + 'Icon'] =
          p[loc + 'Icon'] === undefined || p[loc + 'Icon'] === con.getDirectionFor(this)
            ? con.getDirectionFor(this)
            : 'both';
      }

      plugs.sort((a, b) => a.index - b.index);

      // Layout and measure connections
      const rowBreakPortNameLength = 10;
      let offset = 0;

      function layoutPlugs(plugs, g) {
        for (const p of plugs) {
          // Measure and place the plugs
          const label = p.displayName ? p.displayName : p.property;
          if (p.loc === 'middle' || label.length > rowBreakPortNameLength) {
            // p.col is 'middle' or string to long to share line
            p.index = Math.max(g.rightCons, g.leftCons) + offset;
            g.rightCons = g.leftCons = p.index + 1 - offset;
          } else if (p.loc === 'left') {
            p.index = g.leftCons + offset;
            g.leftCons++;
          } else if (p.loc === 'right') {
            p.index = g.rightCons + offset;
            g.rightCons++;
          }
        }
        return Math.max(g.rightCons, g.leftCons);
      }

      // Don't show group title if there is only and Other group
      offset = layoutPlugs(plugs, { leftCons: 0, rightCons: 0 });

      this.updateIcon(); //make sure we have the right icon when measuring

      if (offset === 0) {
        // No plugs
        size.height = Math.max(NodeGraphEditorNode.size.height, this.titlebarHeight());
      } else {
        size.height =
          offset * NodeGraphEditorNode.propertyConnectionHeight +
          this.titlebarHeight() +
          NodeGraphEditorNode.verticalSpacing * 2;
      }

      this.nodeSize = { width: size.width, height: size.height };

      _.each(this.children, function (child) {
        const childSize = child.measure();
        size.height += childSize.height + NodeGraphEditorNode.childSpacing;
        size.width = Math.max(NodeGraphEditorNode.childMargin + childSize.width, size.width);
      });

      this.measuredSize = size;
    }
    return this.measuredSize;
  }

  shouldConnect(pos, fromNode, origin?) {
    const x = (origin ? origin.x : 0) + this.x;
    const y = (origin ? origin.y : 0) + this.y;

    if (pos.x > x && pos.x < x + this.nodeSize.width && pos.y > y && pos.y < y + this.nodeSize.height) {
      return this;
    }

    // Recurse to children
    for (const i in this.children) {
      const node = this.children[i].shouldConnect(pos, fromNode, { x: x, y: y });
      if (node) return node;
    }
  }

  isVisual() {
    return this.model.type.visual;
  }

  canHaveVisualChildren() {
    return this.model.type.canHaveVisualChildren;
  }

  shouldAttach(pos, nodes) {
    return nodeShouldAttach(this, pos, nodes);
  }

  insertChild(child, index) {
    // Move child position into local coords
    const global = this.global;
    child.x -= global.x;
    child.y -= global.y;

    // Insert child in hierarchy
    child.parent = this;
    this.children.splice(index, 0, child);
  }

  addChild(child) {
    this.children.push(child);
    child.parent = this;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    idx !== -1 && this.children.splice(idx, 1);
  }

  detach() {
    if (this.parent) {
      // Find my position in global space
      const global = this.global;
      this.x = global.x;
      this.y = global.y;

      // Detatch
      const idx = this.parent.children.indexOf(this);
      this.parent.children.splice(idx, 1);
      this.parent = undefined;
    }
  }
}

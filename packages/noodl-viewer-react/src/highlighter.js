import ReactDOM from 'react-dom';

export class Highlighter {
  constructor(noodlRuntime) {
    this.highlightedNodes = new Map();
    this.selectedNodes = new Map();
    this.noodlRuntime = noodlRuntime;

    this.isUpdatingHighlights = false;

    //create the div that holds the highlight and selection UI
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.top = '0';
    div.style.left = '0';
    div.style.overflow = 'hidden';
    div.style.position = 'fixed';
    div.style.zIndex = '1000000000';
    div.style.pointerEvents = 'none';
    document.body.appendChild(div);
    this.highlightRootDiv = div;

    this.windowBorderDiv = this.createHighlightDiv();
    this.windowBorderDiv.style.position = 'absolute';
    this.windowBorderDiv.style.top = '0';
    this.windowBorderDiv.style.left = '0';
    this.windowBorderDiv.style.boxShadow = 'inset 0 0 0 3px #2CA7BA';
    this.windowBorderDiv.style.opacity = '1.0';
    this.windowBorderDiv.style.width = '100vw';
    this.windowBorderDiv.style.height = '100vh';
  }

  createHighlightDiv() {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.outline = '2px solid #2CA7BA';
    div.style.opacity = '1.0';
    return div;
  }

  setWindowSelected(enabled) {
    return; //disable this feature for now, needs some iteration

    /*if (enabled) {
      this.highlightRootDiv.appendChild(this.windowBorderDiv);
    } else {
      this.windowBorderDiv.parentNode && this.windowBorderDiv.parentNode.removeChild(this.windowBorderDiv);
    }*/
  }

  updateHighlights() {
    const items = Array.from(this.highlightedNodes.entries()).concat(Array.from(this.selectedNodes.entries()));

    for (const item of items) {
      const domNode = item[0].getRef() && ReactDOM.findDOMNode(item[0].getRef());

      if (!domNode) {
        //user has deleted this node, just remove it
        this.highlightedNodes.delete(item[0]);
        item[1].remove();
        continue;
      }

      const rect = domNode.getBoundingClientRect();
      const highlight = item[1];

      highlight.style.transform = `translateX(${rect.x}px) translateY(${rect.y}px)`;
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';
    }

    this.isUpdatingHighlights = this.highlightedNodes.size > 0 || this.selectedNodes.size > 0;

    if (this.isUpdatingHighlights) {
      requestAnimationFrame(this.updateHighlights.bind(this));
    }
  }

  highlightNodesWithId(nodeId) {
    //gather all nodes with a DOM node we can highlight, that aren't already highlighted
    const nodes = getNodes(this.noodlRuntime, nodeId)
      .filter((node) => node.getRef)
      .filter((node) => !this.highlightedNodes.has(node));

    for (const node of nodes) {
      const highlight = this.createHighlightDiv();

      this.highlightRootDiv.appendChild(highlight);
      this.highlightedNodes.set(node, highlight);
    }

    if ((this.selectedNodes.size > 0 || this.highlightedNodes.size > 0) && !this.isUpdatingHighlights) {
      this.updateHighlights();
    }
  }

  disableHighlight() {
    for (const item of this.highlightedNodes) {
      const highlight = item[1];
      if (highlight) {
        highlight.remove();
      }
    }
    this.highlightedNodes.clear();
  }

  selectNodesWithId(nodeId) {
    //we don't track when nodes are created, so if there's no root component, wait a while and then highlight so we can get all the instances
    //TODO: track nodes as they're created so newly created nodes can be selected if their IDs match
    if (!this.noodlRuntime.rootComponent) {
      this.noodlRuntime.eventEmitter.once('rootComponentUpdated', () => {
        setTimeout(() => {
          this.selectNodesWithId(nodeId);
        }, 300);
      });
    }

    const nodes = getNodes(this.noodlRuntime, nodeId)
      .filter((node) => node.getRef)
      .filter((node) => !this.selectedNodes.has(node));

    for (const node of nodes) {
      const selection = this.createHighlightDiv();

      this.highlightRootDiv.appendChild(selection);
      this.selectedNodes.set(node, selection);
    }

    if (this.selectedNodes.size > 0) {
      this.setWindowSelected(false);
    }

    if ((this.selectedNodes.size > 0 || this.highlightedNodes.size > 0) && !this.isUpdatingHighlights) {
      this.updateHighlights();
    }

    return nodes;
  }

  deselectNodes() {
    for (const item of this.selectedNodes) {
      const selection = item[1];
      if (selection) {
        selection.remove();
      }
    }
    this.selectedNodes.clear();
  }
}

function getNodes(noodlRuntime, nodeId) {
  if (!noodlRuntime.rootComponent) {
    return [];
  }
  return noodlRuntime.rootComponent.nodeScope.getNodesWithIdRecursive(nodeId);
}

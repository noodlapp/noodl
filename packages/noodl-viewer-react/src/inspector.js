export default class Inspector {
  constructor({ onInspect, onHighlight, onDisableHighlight }) {
    this.onMouseMove = (e) => {
      onDisableHighlight();

      const noodlNode = this.findNoodlNode(e.target);
      if (noodlNode) {
        document.body.style.cursor = 'pointer';
        onHighlight(noodlNode.id);
      } else {
        document.body.style.cursor = 'initial';
      }

      e.stopPropagation();
    };

    this.onClick = (e) => {
      onDisableHighlight();

      const noodlNode = this.findNoodlNode(e.target);
      if (noodlNode) {
        onInspect([noodlNode.id]);
      }

      e.stopPropagation();
      e.preventDefault();

      //not sure how to stop React input elements from getting focus, so blurring the potential element tha got focus on click
      if (document.activeElement) {
        document.activeElement.blur();
      }
    };

    this.onContextMenu = (e) => {
      const nodeIds = document
        .elementsFromPoint(e.clientX, e.clientY)
        .map((dom) => this.findNoodlNode(dom))
        .filter((node) => !!node)
        .map((node) => node.id);

      if (nodeIds.length) {
        onInspect(nodeIds);
      }

      e.stopPropagation();
      e.preventDefault();

      //not sure how to stop React input elements from getting focus, so blurring the potential element tha got focus on click
      if (document.activeElement) {
        document.activeElement.blur();
      }
    };

    this.onMouseOut = (e) => {
      onDisableHighlight();
    };

    this.blockEvent = (e) => {
      e.stopPropagation();
    };

    this.onDisableHighlight = onDisableHighlight;
  }

  setComponent(component) {
    this.component = component;
  }

  enable() {
    //blur active element, if any
    if (document.activeElement) {
      document.activeElement.blur();
    }

    //get events from capture phase, before they tunnel down the tree
    document.addEventListener('mouseenter', this.blockEvent, true);
    document.addEventListener('mouseover', this.blockEvent, true);
    document.addEventListener('mousedown', this.blockEvent, true);
    document.addEventListener('mouseup', this.blockEvent, true);
    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('mouseout', this.onMouseOut, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('contextmenu', this.onContextMenu, true);
  }

  disable() {
    document.body.style.cursor = 'initial';

    document.removeEventListener('mouseenter', this.blockEvent, true);
    document.removeEventListener('mouseover', this.blockEvent, true);
    document.removeEventListener('mousedown', this.blockEvent, true);
    document.removeEventListener('mouseup', this.blockEvent, true);
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('mouseout', this.onMouseOut, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('contextmenu', this.onContextMenu, true);

    this.onDisableHighlight();
  }

  findNoodlNode(dom) {
    //walk the dom tree upwards until a dom element with react state is found
    let domFiber;
    while (!domFiber && dom) {
      const key = Object.keys(dom).find((key) => key.startsWith('__reactInternalInstance$'));
      domFiber = dom[key];
      if (!domFiber) dom = dom.parentElement;
    }

    //found none
    if (!domFiber) {
      return undefined;
    }

    const GetCompFiber = (fiber) => {
      let parentFiber = fiber.return;
      while (parentFiber && typeof parentFiber.type == 'string') {
        parentFiber = parentFiber.return;
      }
      return parentFiber;
    };

    //found a react node, now walk the react tree until a noodl node is found
    //(identified by having a noodlNode prop)
    let compFiber = GetCompFiber(domFiber);
    while (compFiber && (!compFiber.stateNode || !compFiber.stateNode.props || !compFiber.stateNode.props.noodlNode)) {
      compFiber = GetCompFiber(compFiber);
    }

    const noodlNode = compFiber ? compFiber.stateNode.props.noodlNode : undefined;
    if (!noodlNode) return;

    if (this.component) {
      let node = noodlNode;

      while (node) {
        if (node.parentNodeScope) {
          if (node.parentNodeScope.componentOwner.name === this.component.name) {
            return node;
          }
          node = node.parentNodeScope.componentOwner;
        } else {
          if (node.nodeScope.componentOwner.name === this.component.name) {
            return node;
          }
          node = node.nodeScope.componentOwner;
        }
      }

      return node;
    }

    return noodlNode;
  }
}

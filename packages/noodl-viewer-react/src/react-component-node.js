'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import DOMBoundingBoxObserver from './dom-boundingbox-oberver';
import Layout from './layout';
import mergeDeep from './mergedeep';
import NodeSharedPortDefinitions from './node-shared-port-definitions';
import transitionParameter from './node-transitions';

function addOutputPropHandler(node, propCallbacks, propPath) {
  const props = propPath ? node.props[propPath] : node.props;

  for (const propName in propCallbacks) {
    if (props[propName]) {
      const prevCb = props[propName];
      props[propName] = () => {
        prevCb();
        propCallbacks[propName].call(node);
      };
    } else {
      props[propName] = propCallbacks[propName].bind(node);
    }
  }
  node.forceUpdate();
}

function addPrimitiveOutputPropHandler(node, name, output) {
  let prop;

  if (output.type === 'signal') {
    prop = () => {
      node.sendSignalOnOutput(name);
    };
  } else {
    prop = (...args) => {
      node.outputPropValues[name] = output.getValue ? output.getValue.call(node, ...args) : args[0];
      node.flagOutputDirty(name);
      output.onChange && output.onChange.call(node, node.outputPropValues[name]);
    };
  }

  addOutputPropHandler(node, { [name]: prop }, output.propPath);
}

function defineRegularInputProp(input, name) {
  if (!input.type) throw new Error(`input ${name} is missing a type`);

  if (input.type.units) {
    input.set = function (value) {
      const props = input.propPath ? this.props[input.propPath] : this.props;
      if (value && value.value !== undefined) {
        props[name] = value.value + value.unit;
      } else {
        delete props[name];
      }
      if (input.onChange) {
        input.onChange.call(this, value);
      }
      this.forceUpdate();
    };
  } else {
    input.set = function (value) {
      const props = input.propPath ? this.props[input.propPath] : this.props;
      if (value !== undefined) {
        props[name] = value;
      } else {
        delete props[name];
      }
      if (input.onChange) {
        input.onChange.call(this, value);
      }
      this.forceUpdate();
    };
  }
}

function flattenArray(target, array) {
  for (const e of array) {
    if (Array.isArray(e)) {
      flattenArray(target, e);
    } else if (e !== undefined) {
      target.push(e);
    }
  }
}

class NoodlReactComponent extends React.Component {
  componentDidMount() {
    this.props.noodlNode.sendSignalOnOutput('didMount');
  }

  componentWillUnmount() {
    this.props.noodlNode.sendSignalOnOutput('willUnmount');
    //Remove
    const noodlNode = this.props.noodlNode;
    if (noodlNode.currentVisualStates) {
      const statesToRemove = ['hover', 'pressed', 'focused'];
      const vs = noodlNode.currentVisualStates.filter((s) => !statesToRemove.includes(s));
      noodlNode.setVisualStates(vs);
    }
  }

  render() {
    //So the props are a bit tricky here...
    //this.props consist of:
    // - the props passed by the ReactComponentNode.render() function, just {noodlNode}
    // - any additional third party props coming from the parent react component.
    //E.g. the drag node adds event handlers, style, and className to this.props.

    const { noodlNode, style, ...otherProps } = this.props;

    let finalStyle = noodlNode.style;

    //check if there's additional styling from the react parent
    //if so, we need to combine it with the style from the Noodl node
    //let the extra style take priority over the noodl style, if they share some attributes
    //this is wrapped in an if for performance reasons, "..." is quite slow
    if (style) {
      finalStyle = {
        ...noodlNode.style, //styling from the noodl node
        ...style //styling from the react component parent
      };
    }

    const props = {
      ref: (ref) => {
        noodlNode.innerReactComponentRef = ref;
      },
      style: finalStyle,
      //the noodl props coming from the node
      //some components actually have a "style" used for something other than css,
      //so make sure this comes after the "style" prop above, so it can overwrite it
      //(e.g. Jesper's Icon Material UI)
      ...noodlNode.props,

      //otherProps can be empty, but some react components add additional props to their children
      ...otherProps
    };

    if (noodlNode.noodlNodeAsProp) {
      props.noodlNode = noodlNode;

      //nodes that want the noodlNode also get the parent layout
      //since it's used by all built in nodes for layout purposes
      const parent = noodlNode.getVisualParentNode();
      if (parent && parent.props.layout) {
        props.parentLayout = parent.props.layout;
      }
    }

    //optimization. This is used by forceUpdate() to only render this node once per frame.
    noodlNode.renderedAtFrame = noodlNode.context.frameNumber;

    if (noodlNode.useFrame) {
      if (props.textStyle !== undefined) {
        // Apply text style
        props.style = finalStyle = Object.assign({}, props.textStyle, finalStyle);
      }
      Layout.size(finalStyle, props);
      Layout.align(finalStyle, props);

      /*  if(finalStyle.opacity === 0) {
                finalStyle.pointerEvents = 'none';
            }*/
    }

    return React.createElement(noodlNode.reactComponent, props, noodlNode.renderChildren());
  }
}

function setStylesOnDOMNode(rootElement, styles, styleTag) {
  let element = rootElement;

  if (styleTag) {
    //check if the root element has the style tag, if not, find the child that does
    if (element.getAttribute('noodl-style-tag') !== styleTag) {
      element = rootElement.querySelector(`[noodl-style-tag=${styleTag}]`);
    }
  }

  if (!element) return;

  for (const p in styles) {
    element.style[p] = styles[p];
  }
}

let reactKeyCounter = 0;

function createNodeFromReactComponent(def) {
  // visual frame props
  const { frame } = def;
  if (frame !== undefined) {
    if (frame.dimensions) {
      NodeSharedPortDefinitions.addDimensions(def, typeof frame.dimensions === 'object' ? frame.dimensions : undefined);
    }

    if (frame.position) NodeSharedPortDefinitions.addTransformInputs(def);

    if (frame.margins) NodeSharedPortDefinitions.addMarginInputs(def);

    if (frame.padding) NodeSharedPortDefinitions.addPaddingInputs(def);

    if (frame.align) NodeSharedPortDefinitions.addAlignInputs(def);

    //  NodeSharedPortDefinitions.addSharedVisualInputs(ReactComponentNode);

    // NodeSharedPortDefinitions.addPointerEventOutputs(ReactComponentNode);
  }

  const {
    initialize,
    inputs,
    inputProps,
    inputCss,
    outputs,
    outputProps,
    dynamicports,
    defaultCss = {},
    methods
  } = def;

  //assign default values to style
  const startStyle = Object.assign({}, defaultCss);
  const startStyles = {};

  for (const name in inputCss) {
    const input = inputCss[name];

    const hasDefault = input.hasOwnProperty('default') && input.applyDefault !== false;
    if (input.styleTag && !startStyles.hasOwnProperty(input.styleTag)) {
      startStyles[input.styleTag] = {};
    }

    if (hasDefault) {
      const value = input.type.units ? input.default + input.type.defaultUnit : input.default;
      if (input.styleTag) {
        startStyles[input.styleTag][name] = value;
      } else {
        startStyle[name] = value;
      }
    }
  }

  function boundingBoxObserverCallback(attribute, rect) {
    this.clientBoundingRect = rect;
    if (attribute === 'x') {
      this.flagOutputDirty('screenPositionX');
    } else if (attribute === 'y') {
      this.flagOutputDirty('screenPositionY');
    } else if (attribute === 'width') {
      this.flagOutputDirty('boundingWidth');
    } else if (attribute === 'height') {
      this.flagOutputDirty('boundingHeight');
    }
  }

  const useVariants = def.useVariants !== undefined ? def.useVariants : true;

  const ReactComponentNode = {
    name: def.name,
    docs: def.docs,
    displayNodeName: def.displayNodeName || def.displayName,
    shortDesc: '',
    category: 'Visual',
    allowChildren: def.allowChildren === undefined ? true : def.allowChildren, //default to true
    visualStates: def.visualStates,
    allowAsExportRoot: def.allowAsExportRoot,
    singleton: def.singleton,
    useVariants,
    usePortAsLabel: def.usePortAsLabel,
    portLabelTruncationMode: def.portLabelTruncationMode,
    connectionPanel: def.connectionPanel,
    nodeDoubleClickAction: def.nodeDoubleClickAction,
    initialize() {
      this.reactKey = 'key' + reactKeyCounter;
      reactKeyCounter++;

      this.children = [];
      if (hasChildCountOutput) {
        this.childrenCount = 0;
      }

      this.props = { styles: {} };
      this.outputPropValues = {};
      this.style = Object.assign({}, startStyle);

      for (const styleTag in startStyles) {
        this.props.styles[styleTag] = Object.assign({}, startStyles[styleTag]);
      }
      this.childIndex = 0;
      this.clientBoundingRect = {};
      this.noodlNodeAsProp = def.noodlNodeAsProp ? true : false;

      const pollDelay = this.context && this.context.runningInCanvas ? 300 : 0;
      this.boundingBoxObserver = new DOMBoundingBoxObserver(boundingBoxObserverCallback.bind(this), pollDelay);

      this.wantsToBeMounted = true;

      this.useFrame = !!frame;

      //assign default values to props
      for (const name in inputProps) {
        const input = inputProps[name];
        if (input.propPath && !this.props.hasOwnProperty(input.propPath)) {
          this.props[input.propPath] = {};
        }

        const props = input.propPath ? this.props[input.propPath] : this.props;

        if (input.hasOwnProperty('default')) {
          if (input.type.defaultUnit && input.default !== undefined) {
            props[name] = input.default + input.type.defaultUnit;
          } else {
            props[name] = input.default;
          }
        }
      }

      //set ut props that send data on noodl outputs
      for (const outputName in outputProps) {
        const output = outputProps[outputName];
        if (output.propPath && !this.props.hasOwnProperty(output.propPath)) {
          this.props[output.propPath] = {};
        }

        if (!output.props) {
          addPrimitiveOutputPropHandler(this, outputName, output);
        } else {
          addOutputPropHandler(this, output.props, output.propPath);
        }
      }

      this.reactComponentRef = null;
      this.reactComponent = def.getReactComponent.call(this);

      if (initialize) {
        initialize.call(this);
      }
    },
    getInspectInfo: def.getInspectInfo,
    nodeScopeDidInitialize: def.nodeScopeDidInitialize,
    dynamicports,
    inputs: {
      cssClassName: {
        index: 100010,
        displayName: 'CSS Class',
        group: 'Advanced HTML',
        type: 'string',
        default: '',
        set(value) {
          this.props.className = value;
          this.forceUpdate();
        }
      },
      styleCss: {
        index: 100011,
        displayName: 'CSS Style',
        group: 'Advanced HTML',
        type: {
          name: 'string',
          codeeditor: 'text',
          allowEditOnly: true
        },
        default: '/* background-color: red; */',
        set(value) {
          this.updateAdvancedStyle({ content: value });
        }
      }
    },
    outputs: {
      childIndex: {
        displayName: 'Child Index',
        type: 'number',
        get() {
          return this.childIndex;
        }
      },
      this: {
        displayName: 'This',
        type: 'reference',
        get() {
          return this;
        }
      },
      screenPositionX: {
        group: 'Bounding Box',
        displayName: 'Screen Position X',
        type: 'number',
        get() {
          return this.clientBoundingRect.x;
        },
        onFirstConnectionAdded() {
          this.boundingBoxObserver.addObserver();
        },
        onLastConnectionRemoved() {
          this.boundingBoxObserver.removeObserver();
        }
      },
      screenPositionY: {
        group: 'Bounding Box',
        displayName: 'Screen Position Y',
        type: 'number',
        get() {
          return this.clientBoundingRect.y;
        },
        onFirstConnectionAdded() {
          this.boundingBoxObserver.addObserver();
        },
        onLastConnectionRemoved() {
          this.boundingBoxObserver.removeObserver();
        }
      },
      boundingWidth: {
        group: 'Bounding Box',
        displayName: 'Width',
        type: 'number',
        get() {
          return this.clientBoundingRect.width;
        },
        onFirstConnectionAdded() {
          this.boundingBoxObserver.addObserver();
        },
        onLastConnectionRemoved() {
          this.boundingBoxObserver.removeObserver();
        }
      },
      boundingHeight: {
        group: 'Bounding Box',
        displayName: 'Height',
        type: 'number',
        get() {
          return this.clientBoundingRect.height;
        },
        onFirstConnectionAdded() {
          this.boundingBoxObserver.addObserver();
        },
        onLastConnectionRemoved() {
          this.boundingBoxObserver.removeObserver();
        }
      },
      didMount: {
        group: 'Mounted',
        displayName: 'Did Mount',
        type: 'signal'
      },
      willUnmount: {
        group: 'Mounted',
        displayName: 'Will Unmount',
        type: 'signal'
      }
    },
    methods: {
      updateAdvancedStyle(params) {
        //remove previous styles first
        if (this.customCssStyles) {
          this.removeStyle(Object.keys(this.customCssStyles));
          this.customCssStyles = undefined;
        }

        let style;
        let errorMessage = '';

        let rawCss = (params.content || '').replace('\n', '');

        // strip away comments
        let css = '';
        while (rawCss.length) {
          let nextComment = rawCss.indexOf('/*');
          if (nextComment === -1) {
            nextComment = rawCss.length;
          }
          css += rawCss.substring(0, nextComment);
          rawCss = rawCss.substring(nextComment);

          if (rawCss.length) {
            //were inside a comment
            let endComment = rawCss.indexOf('*/');
            if (endComment === -1) endComment = rawCss.length;
            rawCss = rawCss.substring(endComment + 2);
          }
        }
        function trim(s) {
          return s.replace(/^\s+|\s+$/gm, '');
        }

        const styles = css
          .split(';')
          .map(trim)
          .filter((s) => s.length);

        style = {};
        for (const s of styles) {
          const parts = s.split(':').map(trim);

          if (s.indexOf('\n') !== -1) {
            errorMessage += 'Missing semicolon: ' + s.split('\n')[0];
          } else if (parts.length !== 2) {
            errorMessage += 'Syntax error: ' + s;
          } else {
            const nameParts = parts[0].split('-');
            for (let i = 1; i < nameParts.length; i++) {
              nameParts[i] = nameParts[i][0].toUpperCase() + nameParts[i].substring(1);
            }
            style[nameParts.join('')] = parts[1];
          }
        }

        if (errorMessage) {
          this.context.editorConnection.sendWarning(this.nodeScope.componentOwner.name, this.id, 'css-parse-waring', {
            message: 'Error in CSS Style<br>' + errorMessage
          });
        } else {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'css-parse-waring');
          style && this.setStyle(style);
          this.customCssStyles = style;
        }
      },
      setChildIndex(index) {
        this.childIndex = index;
        this.flagOutputDirty('childIndex');
      },
      updateChildIndices() {
        let indexOffset = 0;
        for (let i = 0; i < this.children.length; i++) {
          const child = this.children[i];
          if (child.name === 'For Each' || child.name === 'Component Children') {
            indexOffset--;
          }
          child.setChildIndex && child.setChildIndex(i + indexOffset);
        }
      },
      updateChildrenCount() {
        let count = 0;
        this.children.forEach((child) => {
          if (child?.model?.type === 'For Each') {
            count += child.model.children.length;
          } else {
            count++;
          }
        });
        this.childrenCount = count;
        this.flagOutputDirty('childrenCount');
      },
      addChild(child, index) {
        if (index === undefined) {
          index = this.children.length;
        }

        child.parent = this;
        this.children.splice(index, 0, child);
        this.cachedChildren = undefined;
        this.scheduleUpdateChildCountAndIndicies();
        this.forceUpdate();
      },
      removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
          this.children.splice(index, 1);
          child.parent = undefined;

          this.cachedChildren = undefined;
          this.scheduleUpdateChildCountAndIndicies();
          this.forceUpdate();
        }
      },
      contains(node) {
        //breadth first
        const index = this.children.indexOf(node);
        if (index !== -1) return true;

        return this.children.some((child) => child.contains && child.contains(node));
      },
      scheduleUpdateChildCountAndIndicies() {
        if (this.updateChildIndiciesScheduled) return;
        this.updateChildIndiciesScheduled = true;
        this.scheduleAfterInputsHaveUpdated(() => {
          this.updateChildIndices();
          if (hasChildCountOutput) {
            this.updateChildrenCount();
          }
          this.updateChildIndiciesScheduled = false;
        });
      },
      getChildren() {
        return this.children;
      },
      isChild(child) {
        return this.children.indexOf(child) !== -1;
      },
      getChildRoot() {
        return this;
      },
      forceUpdate() {
        if (this.forceUpdateScheduled === true) return;
        this.forceUpdateScheduled = true;

        this.context.eventEmitter.once('frameEnd', () => {
          this.forceUpdateScheduled = false;

          if (this.renderedAtFrame === this.context.frameNumber) {
            return;
          }

          this.reactComponentRef && this.reactComponentRef.setState({});
        });
        this.context.scheduleUpdate();
      },
      _resetReactVirtualDOM() {
        //reset the react key to force a full re-render
        //this can be required since we're editing the DOM tree, without React knowing
        //and can confuse React in certain cases
        this.reactKey = 'key' + reactKeyCounter;
        reactKeyCounter++;
        const parent = this.getVisualParentNode();
        if (parent) {
          parent.cachedChildren = undefined;
          parent.forceUpdate();
        }
      },
      /** Added for SSR Support */
      triggerDidMount() {
        if (this.wantsToBeMounted && !this.didCallTriggerDidMount) {
          this.didCallTriggerDidMount = true;

          if (this.hasOutput('didMount')) {
            this.sendSignalOnOutput('didMount');
          }

          // HACK: This is requried for the Page Router.
          if (this.props.didMount) {
            this.props.didMount();
          }

          // HACK: Repeater... same as above
          if (this.didMount) {
            this.didMount();
          }
        }

        this.children.forEach((child) => {
          // TODO: Repeater is missing triggerDidMount
          child.triggerDidMount && child.triggerDidMount();
        });
      },
      render() {
        if (!this.wantsToBeMounted) {
          return;
        }

        //these props will only be sent when this component
        //is added to the react tree. Further updates will only call
        //render on the NoodlReactComponent, so make sure these props
        //don't need to change over the lifetime of this node
        return React.createElement(NoodlReactComponent, {
          key: this.reactKey,
          noodlNode: this,
          ref: (ref) => {
            this.reactComponentRef = ref;
            this.boundingBoxObserver.setTarget(ReactDOM.findDOMNode(ref));
          }
        });
      },
      renderChildren() {
        if (!this.cachedChildren) {
          let c = this.children.map((child) => child.render());

          let children = [];
          flattenArray(children, c);

          if (children.length === 0) {
            children = null;
          } else if (children.length === 1) {
            //some components expects a single child only, and won't handle arrays
            //and React.Children.only() throws an error on an array with only one child
            children = children[0];
          }

          this.cachedChildren = children;
        }

        return this.cachedChildren;
      },
      setStyle(newStyles, styleTag) {
        //this method will try to set css styles directly on the
        //raw DOM elements, circumventing React.
        //However, there's some layout and align attributes that are dependent
        //on each other and need to go through additional processing.
        //This function will detect those and trigger everything to run through the
        //React component when necessary.

        //TODO: move all these checks to the inputs themselves
        //so the set-method of e.g. marginLeft can do the check and either
        //set the style directly on the dom node, or trigger a react render
        const styleObject = styleTag ? this.props.styles[styleTag] : this.style;

        for (const p in newStyles) {
          styleObject[p] = newStyles[p];
        }

        const domElement = this.getDOMElement();
        if (!domElement) return;

        let forceUpdate = false;

        if (!styleTag) {
          if (newStyles.hasOwnProperty('opacity')) {
            //opacity change between zero and non-zero can toggle pointer events
            //to be treated differently, so make sure to force update during those transitions

            //note: properties in domElement.style are all strings
            forceUpdate =
              newStyles.hasOwnProperty('opacity') &&
              ((domElement.style.opacity === '0' && newStyles.opacity > 0) ||
                (domElement.style.opacity !== '0' && newStyles.opacity === 0));
          }
          if (newStyles.transform) {
            let transform = newStyles.transform;

            const parent = this.getVisualParentNode();
            //three ways we can be position absolute:
            //1. user explicitly set this node to absolute
            //2. parent has no layout, which translate into no flexDirection
            //3. there is no parent, meaning we're a root in the root component
            if (this.style.position === 'absolute' || !parent || !parent.style.flexDirection) {
              if (this.props.alignX === 'center' && !(domElement.style.marginLeft && domElement.style.marginRight))
                transform = 'translateX(-50%) ' + transform;
              if (this.props.alignY === 'center' && !(domElement.style.marginTop && domElement.style.marginBottom))
                transform = 'translateY(-50%) ' + transform;
            }

            newStyles.transform = transform;
          }

          const marginsChanged =
            newStyles.hasOwnProperty('marginLeft') ||
            newStyles.hasOwnProperty('marginRight') ||
            newStyles.hasOwnProperty('marginTop') ||
            newStyles.hasOwnProperty('marginBottom');
          const sizeInPercent =
            (this.props.width && this.props.width[this.props.width.length - 1] === '%') ||
            (this.props.height && this.props.height[this.props.height.length - 1] === '%');
          if (sizeInPercent && marginsChanged) {
            forceUpdate = true;
          }

          if (newStyles.position || newStyles.flexDirection || newStyles.clip) {
            forceUpdate = true;
          }
        }

        if (forceUpdate) {
          this.forceUpdate();
        } else {
          setStylesOnDOMNode(domElement, newStyles, styleTag);
        }
      },
      removeStyle(styles, styleTag) {
        const styleObject = styleTag ? this.props.styles[styleTag] : this.style;

        for (const p of styles) {
          delete styleObject[p];
        }

        const domElement = this.getDOMElement();

        let forceUpdate = false;
        if (!styleTag && domElement) {
          const forceUpdateAttributes = {
            marginTop: true,
            marginBottom: true,
            marginLeft: true,
            marginRight: true
          };

          for (const p of styles) {
            if (forceUpdateAttributes[p]) forceUpdate = true;
          }
        }

        if (domElement) {
          //deleting styles is done by setting them to an empty string
          const newStyles = {};
          for (const p of styles) {
            newStyles[p] = '';
          }
          setStylesOnDOMNode(domElement, newStyles, styleTag);
        }

        if (forceUpdate) {
          this.forceUpdate();
        }
      },
      getStyle(style) {
        return this.style[style];
      },
      getRef() {
        return this.reactComponentRef;
      },
      getDOMElement() {
        const ref = this.getRef();
        if (!ref) return;

        return ReactDOM.findDOMNode(ref);
      },
      getVisualParentNode() {
        if (this.parent) return this.parent;

        //we're a root
        let component = this.nodeScope.componentOwner;
        while (!component.parent && component.parentNodeScope) {
          component = component.parentNodeScope.componentOwner;
        }

        return component ? component.parent : undefined;
      },
      setVariant(variant) {
        //stop any state transitions that are currently running
        this._stopStateTransitions();

        this.variant = variant;

        const parameters = {};
        //apply base variant parameters
        variant && mergeDeep(parameters, variant.parameters);

        //apply base node parameters
        mergeDeep(parameters, this.model.parameters);

        //and then states, if any
        if (this.currentVisualStates) {
          const stateParameters = this.getParametersForStates(this.currentVisualStates);
          mergeDeep(parameters, stateParameters);
        }

        const parametersToSet = Object.keys(parameters).filter((p) => !this._hasInputBeenSetFromAConnection(p));

        for (const inputName of parametersToSet) {
          this.registerInputIfNeeded(inputName);

          if (this.hasInput(inputName)) {
            this.queueInput(inputName, parameters[inputName]);
          }
        }
      },
      getParameter(name) {
        if (this.model.parameters.hasOwnProperty(name)) {
          return this.model.parameters[name];
        } else if (this.variant && this.variant.parameters.hasOwnProperty(name)) {
          return this.variant.parameters[name];
        } else {
          return this.context.getDefaultValueForInput(this.model.type, name);
        }
      },
      getParametersForStates(states) {
        const params = {};

        //1. Get the parameters from the variant
        //2. Then override with all local values from the node's neutral state (so a color in neutral will override all states from the variant)
        //3. then apply the node specific state parameters

        //1. Apply variant states
        if (this.variant) {
          for (const state of states) {
            if (this.variant.stateParameters && this.variant.stateParameters.hasOwnProperty(state)) {
              mergeDeep(params, this.variant.stateParameters[state]);
            }
          }
        }

        //2. Override with local values from the nodes neutral state
        for (const param in params) {
          if (this.model.parameters.hasOwnProperty(param)) {
            if (isObject(params[param])) {
              mergeDeep(params[param], this.model.parameters[param]);
            } else {
              params[param] = this.model.parameters[param];
            }
          }
        }
        // mergeDeep(params, this.model.parameters);

        //3. Apply node specific state paramters
        if (this.model.stateParameters) {
          for (const state of states) {
            if (this.model.stateParameters.hasOwnProperty(state)) {
              mergeDeep(params, this.model.stateParameters[state]);
            }
          }
        }

        return params;
      },
      _getNewState(prevStates, newStates) {
        const addedStates = newStates.filter((value) => !(prevStates || []).includes(value));
        const newState = addedStates.length ? addedStates[0] : 'neutral';

        return newState === '' ? 'neutral' : newState;
      },
      _getDefaultTransition(state) {
        if (
          this.model.defaultStateTransitions &&
          this.model.defaultStateTransitions[state] &&
          this.model.defaultStateTransitions[state].curve
        ) {
          return this.model.defaultStateTransitions[state];
        } else if (
          this.variant &&
          this.variant.defaultStateTransitions &&
          this.variant.defaultStateTransitions[state] &&
          this.variant.defaultStateTransitions[state].curve
        ) {
          return this.variant.defaultStateTransitions[state];
        }
      },
      _getStateTransition(state) {
        let transitions = {};

        if (this.model.stateTransitions && this.model.stateTransitions[state]) {
          Object.assign(transitions, this.model.stateTransitions[state]);
        }

        if (this.variant && this.variant.stateTransitions && this.variant.stateTransitions[state]) {
          Object.assign(transitions, this.variant.stateTransitions[state]);
        }

        return transitions;
      },
      setVisualStates(newStates) {
        if (!this.model) {
          //this node has probably been generated by a router or similar, and is an internal node without a model
          //those nodes can't have visual states
          return;
        }

        const statesAreEqual =
          this.currentVisualStates &&
          newStates.length === this.currentVisualStates.length &&
          newStates.every((val, index) => val === this.currentVisualStates[index]);
        if (statesAreEqual) return;

        const prevStateParams = this.currentVisualStates ? this.getParametersForStates(this.currentVisualStates) : {};
        const newStateParams = this.getParametersForStates(newStates);

        const newState = this._getNewState(this.currentVisualStates, newStates);

        this.currentVisualStates = newStates;

        const newValues = {};

        //all params that were in the old states, but not in the new states, needs to be reset back to original state
        for (const param in prevStateParams) {
          if (!newStateParams.hasOwnProperty(param) && !this._hasInputBeenSetFromAConnection(param)) {
            const value = this.getParameter(param);
            if (value !== undefined) {
              newValues[param] = this.getParameter(param);
            }
          }
        }

        for (const param in newStateParams) {
          if (!this._hasInputBeenSetFromAConnection(param) && newStateParams[param] !== undefined) {
            newValues[param] = newStateParams[param];
          }
        }

        const defaultTransition = this._getDefaultTransition(newState);
        const stateTransition = this._getStateTransition(newState);

        for (const param in newValues) {
          if (stateTransition[param] && stateTransition[param].curve) {
            transitionParameter(this, param, newValues[param], stateTransition[param]);
          } else if (!stateTransition[param] && defaultTransition) {
            transitionParameter(this, param, newValues[param], defaultTransition);
          } else {
            //stop any running transition
            if (this._transitions && this._transitions[param]) {
              this._transitions[param].stop();
              delete this._transitions[param];
            }

            this.queueInput(param, newValues[param]);
          }
        }
      },
      _getVisualStates() {
        return this.currentVisualStates || [];
      },
      _stopStateTransitions() {
        if (!this._transitions) return;

        for (const name in this._transitions) {
          this._transitions[name].stop();
          delete this._transitions[name];
        }
      }
    }
  };

  if (useVariants) {
    ReactComponentNode.inputs.variant = {
      displayName: 'Variant',
      group: 'General',
      type: {
        name: 'string',
        allowConnectionsOnly: true
      },
      set(variantName) {
        if (this.variant && this.variant.name === variantName) return;
        const variant = this.context.variants.getVariant(this.model.type, variantName);
        variant && this.setVariant(variant);
      }
    };
  }

  if (def.mountedInput !== false) {
    ReactComponentNode.inputs.mounted = {
      displayName: 'Mounted',
      index: 9999,
      type: 'boolean',
      group: 'General',
      default: true,
      set(value) {
        value = value ? true : false;
        if (this.wantsToBeMounted !== value) {
          this.wantsToBeMounted = value;
          //either we have a direct parent, or we're a root and need to tell
          //the parent of the component instance instead
          const parent = this.getVisualParentNode();
          if (parent) {
            parent.cachedChildren = undefined;
            parent.forceUpdate();
          }
        }
      }
    };
  }

  const hasChildCountOutput = ReactComponentNode.allowChildren || ReactComponentNode.displayName;

  if (hasChildCountOutput) {
    ReactComponentNode.outputs.childrenCount = {
      displayName: 'Children Count',
      type: 'number',
      get() {
        return this.childrenCount;
      }
    };
  }

  //regular inputs
  for (const name in inputs) {
    ReactComponentNode.inputs[name] = inputs[name];
  }

  //inputs that set react props
  for (const inputName in inputProps) {
    const input = inputProps[inputName];
    if (input.type === 'node') {
      input.type = 'reference';
      input.set = function (value) {
        const props = input.propPath ? this.props[input.propPath] : this.props;
        if (value !== undefined) {
          props[inputName] = value.render();
        } else {
          delete props[inputName];
        }
        this.forceUpdate();
      };
    } else {
      if (input.type === 'signal') {
        console.error(`Error: Signals not supported as a react prop. node: '${def.name}' input: '${inputName}'`);
      } else {
        defineRegularInputProp(input, inputName);
      }
    }

    ReactComponentNode.inputs[inputName] = input;
  }

  //inputs that set a css attribute
  for (const name in inputCss) {
    const input = inputCss[name];
    const styleTargetName = input.targetStyleProperty || name;

    if (input.type.units) {
      input.set = function (value) {
        if (typeof value !== 'object' && input.type.defaultUnit) {
          value = { value, unit: input.type.defaultUnit };
        }

        if (typeof value === 'object' && value.value !== undefined) {
          //this is a value with a unit
          this.setStyle({ [styleTargetName]: value.value + value.unit }, input.styleTag);
        } else if (value !== undefined) {
          //value without a unit. One example is line height, that can be unitless
          this.setStyle({ [styleTargetName]: value }, input.styleTag);
        } else {
          //value is undefined, so just reset the style
          this.removeStyle([styleTargetName], input.styleTag);
        }
        if (input.onChange) {
          input.onChange.call(this, value);
        }
      };
    } else {
      input.set = function (value) {
        if (value !== undefined) {
          this.setStyle({ [styleTargetName]: value }, input.styleTag);
        } else {
          this.removeStyle([styleTargetName], input.styleTag);
        }
        if (input.onChange) {
          input.onChange.call(this, value);
        }
      };
    }

    ReactComponentNode.inputs[name] = input;
  }

  //regular outputs
  for (const name in outputs) {
    ReactComponentNode.outputs[name] = outputs[name];
  }

  //outputs triggered by react props
  for (const name in outputProps) {
    const output = outputProps[name];

    if (output.type !== 'signal') {
      output.get = function () {
        return this.outputPropValues[name];
      };
    }

    ReactComponentNode.outputs[name] = output;
  }

  for (const name in methods) {
    ReactComponentNode.methods[name] = methods[name];
  }

  return {
    node: ReactComponentNode,
    setup: def.setup
  };
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export { createNodeFromReactComponent };

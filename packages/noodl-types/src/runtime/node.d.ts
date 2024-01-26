import { TimerScheduler } from "./timer_scheduler.d";

type TSFixme = any;

export interface EventSender {
  addChild(child, index);
  addInputPort(port);
  addOutputPort(port);
  getInputPort(portName);
  getInputPorts();
  getOutputPort(portName);
  getOutputPorts();
  removeChild(child);
  removeInputPortWithName(portName);
  removeOutputPortWithName(portName);
  reset();
  setDefaultStateTransition(stateTransition, state);
  setParameter(name, value, state);
  setParameters(parameters);
  setStateParameters(parameters);
  setStateTransitionParamter(parameter, curve, state);
  setStateTransitions(stateTransitions);
  setVariant(variant);
  updateInputPortTypes(ports);
  updateOutputPortTypes(ports);

  emit(eventName, data): Promise<TSFixme>;
  on(eventName, callback, ref);
  removeAllListeners(eventName);
  removeListenersWithRef(ref);
}

export interface ComponentModel extends EventSender /* TODO: Is this true? */ {
  connections: {
    sourceId: string;
    sourcePort: string;
    targetId: string;
    targetPort: string;
  }[];
  inputPorts: {};
  listeners: {};
  listenersWithRefs: {};
  metadata: {};
  name: string;
  nodes: {};
  outputPorts: {};
  roots: string[];
}

export interface NodeModel extends EventSender {
  children: TSFixme[];
  component: ComponentModel;
  id: string;
  inputPorts: {};
  inputs: TSFixme[];
  listeners: {};
  listenersWithRefs: {};
  outputPorts: {};
  outputs: TSFixme[];
  parameters: {};
  parent: NodeModel;
  type: string;
}

export interface NodeObject {
  addDeleteListener(listener);
  connectInput(inputName, sourceNode, sourcePortName);
  deregisterInput(name);
  deregisterOutput(name);
  flagAllOutputsDirty();
  flagDirty();
  flagOutputDirty(name);
  getInput(name);
  getInputValue(name);
  getOutput(name);
  hasInput(name);
  hasOutput(name);
  isInputConnected(inputName);
  model: NodeModel;
  queueInput(inputName, value);
  registerInput(name, input);
  registerInputIfNeeded();
  registerInputs(inputs);
  registerOutput(name, output);
  registerOutputIfNeeded();
  registerOutputs(outputs);
  removeInputConnection(inputName, sourceNodeId, sourcePortName);
  scheduleAfterInputsHaveUpdated(callback);
  sendSignalOnOutput(outputName);
  sendValue(name, value);
  setInputValue(name, value);
  setNodeModel(nodeModel);
  update();
}

export interface Node extends NodeObject {
  name: string;

  addChild(child, index);
  contains(node);
  forceUpdate();
  getChildRoot();
  getChildren();
  getDOMElement();
  getParameter(name);
  getParametersForStates(states);
  getRef();
  getStyle(style);
  getVisualParentNode();
  isChild(child);
  removeChild(child);
  removeStyle(styles, styleTag);
  render();
  renderChildren();
  scheduleUpdateChildIndices();
  setChildIndex(index);
  setNodeModel(nodeModel);
  setStyle(newStyles, styleTag);
  setVariant(variant);
  setVisualStates(newStates);
  updateAdvancedStyle(params);
  updateChildIndices();
}

export interface NodeContext {
  timerScheduler: TimerScheduler;
}

export interface NodeScope {}

export interface NodeConstructor extends Node {
  /** @deprecated This is only the graph parent, not the active parent. */
  parent?: NodeConstructor;

  getVisualParentNode(): NodeConstructor | undefined;

  cachedChildren: TSFixme;
  childIndex: number;
  children: NodeConstructor[];
  clientBoundingRect: TSFixme;
  context: NodeContext;
  forceUpdateScheduled: boolean;
  id: string;
  nodeScope: NodeScope;
  noodlNodeAsProp: boolean;
  outputPropValues: TSFixme;
  props: TSFixme;
  reactComponent: () => TSFixme;
  reactComponentRef: TSFixme;
  reactKey: string;
  renderedAtFrame: number;
  style: TSFixme;
  updateChildIndiciesScheduled: boolean;
  useFrame: boolean;
  wantsToBeMounted: boolean;
}

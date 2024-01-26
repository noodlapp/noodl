const pointerEvents = [
  'onClick',
  'onMouseDown',
  'onMouseMove',
  'onMouseUp',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseOver',
  'onMouseOut',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
  'onPointerDown',
  'onPointerMove',
  'onPointerUp',
  'onPointerCancel'
];

//These should not be blocked, it causes some annoying behaviour when using hover
const pointerEventsNotToBlock = new Set(['onMouseLeave', 'onMouseOut']);

export default function pointerProps(props) {
  const newProps = {};

  for (const eventName of pointerEvents) {
    if (props.blockTouch && !pointerEventsNotToBlock.has(eventName)) {
      //Noodl stores pointer event callbacks in props.pointer
      if (props.pointer && props.pointer[eventName]) {
        newProps[eventName] = (e) => {
          props.pointer[eventName](e);
          e.stopPropagation();
        };
      }
      //some third party library might add pointer event callbacks as well, so look for callbacks directly on the props object
      else if (props[eventName]) {
        newProps[eventName] = (e) => {
          props[eventName](e);
          e.stopPropagation();
        };
      } else {
        //there was no existing listener, so create a new one that just blocks
        newProps[eventName] = (e) => {
          e.stopPropagation();
        };
      }
    }
    //check if third party code added a listener
    else if (props[eventName]) {
      newProps[eventName] = props[eventName];
    }
    //check if Noodl added a listener
    else if (props.pointer) {
      newProps[eventName] = props.pointer[eventName];
    }
  }

  if (props.noodlNode) {
    for (const p in newProps) {
      const f = newProps[p];
      if (f) {
        newProps[p] = (e) => {
          f.call(this, e);
          props.noodlNode.context.updateDirtyNodes();
        };
      }
    }
  }

  return newProps;
}

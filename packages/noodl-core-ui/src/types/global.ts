import React, {
  JSXElementConstructor,
  ReactChild,
  ReactElement,
  ReactFragment,
  ReactPortal,
  ReactText
} from 'react';

export interface UnsafeStyleProps {
  UNSAFE_className?: string;
  UNSAFE_style?: React.CSSProperties;
}

// FIXME: add generics to be able to specify what exact components are allowed?
export type SingleSlot =
  | ReactElement<TSFixme, TSFixme>
  | ReactFragment
  | ReactPortal
  | boolean
  | null
  | undefined;

export type Slot = SingleSlot | SingleSlot[];

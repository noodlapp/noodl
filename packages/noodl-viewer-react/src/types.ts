import React, { ReactElement, ReactFragment, ReactPortal } from 'react';

import type { NodeConstructor } from '../typings/global';

export namespace Noodl {
  export type SizeMode = 'explicit' | 'contentWidth' | 'contentHeight' | 'contentSize';

  export type Color = string;

  export type Image = string;

  export type Icon = {
    class: string;
    code: string;
    codeAsClass?: boolean;
  };

  export type TextStyle = {
    color: string;
    fontFamily: string;
    fontSize: string;
    letterSpacing: string;
    lineHeight: string;
    textTransform: React.CSSProperties['textTransform'];
  };

  export interface ReactProps {
    noodlNode: NodeConstructor;
    style: React.CSSProperties;
    styles: Record<string, React.CSSProperties>;
    className: string;
    parentLayout: 'none' | 'row' | 'column';
  }
}

export type SingleSlot = ReactElement<unknown> | ReactFragment | ReactPortal | boolean | null | undefined;

export type Slot = SingleSlot | SingleSlot[];

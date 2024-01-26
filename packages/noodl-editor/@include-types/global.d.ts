declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.css' {
  const styles: { readonly [key: string]: string };
  export default styles;
}

declare module '*.scss' {
  const styles: { readonly [key: string]: string };
  export default styles;
}

type TSFixme = any;

type NodeColor = 'data' | 'visual' | 'logic' | 'component' | 'javascript';

interface Window {
  noodlEditorPreviewRoute: string;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

type PartialWithRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;

type TSFixme = any;

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

import NoodlViewerReact, { ssrSetupRuntime } from './noodl-viewer-react';

export { NoodlViewerReact, ssrSetupRuntime };
globalThis.NoodlSSR = { createElement: NoodlViewerReact.createElement, ssrSetupRuntime };

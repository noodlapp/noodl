import React from 'react';
import ReactDOM from 'react-dom';
import NoodlRuntime from '@noodl/runtime';

import registerPolyfills from './src/polyfills';
import Viewer, { ssrSetupRuntime } from './src/viewer.jsx';

registerPolyfills();

function createArgs() {
  // Support SSR
  if (typeof window === 'undefined') {
    return {
      type: 'browser',
      platform: {
        requestUpdate: (callback) => setImmediate(callback),
        getCurrentTime: () => 0,
        objectToString: (o) => JSON.stringify(o, null, 2)
      },
      componentFilter: (c) => !c.name.startsWith('/#__cloud__/')
    };
  }

  return {
    type: 'browser',
    platform: {
      requestUpdate: (callback) => window.requestAnimationFrame(callback),
      getCurrentTime: () => window.performance.now(),
      objectToString: (o) => JSON.stringify(o, null, 2)
    },
    componentFilter: (c) => !c.name.startsWith('/#__cloud__/')
  };
}

export { ssrSetupRuntime };

export default {
  render(element, noodlModules, { isLocal = false }) {
    const runtimeArgs = createArgs();

    if (isLocal) {
      runtimeArgs.platform.isRunningLocally = () => true;
    }

    const noodlRuntime = new NoodlRuntime(runtimeArgs);

    ReactDOM.render(React.createElement(Viewer, { noodlRuntime, noodlModules }, null), element);
  },
  renderDeployed(element, noodlModules, projectData) {
    // React SSR adds a 'data-reactroot' attribute on the root element to be able to hydrate the app.
    if (element.children.length > 0 && !!element.children[0].hasAttribute('data-reactroot')) {
      ReactDOM.hydrate(this.createElement(noodlModules, projectData), element);
    } else {
      ReactDOM.render(this.createElement(noodlModules, projectData), element);
    }
  },
  /** This can be called for server side rendering too. */
  createElement(noodlModules, projectData) {
    const noodlRuntime = new NoodlRuntime({
      ...createArgs(),
      runDeployed: true
    });

    return React.createElement(Viewer, { noodlRuntime, noodlModules, projectData }, null);
  }
};

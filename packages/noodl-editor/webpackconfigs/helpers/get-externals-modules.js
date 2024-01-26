const fs = require('fs');
const packageJson = require('../../package');

module.exports = function ({ production }) {
  //some modules are not packaged in the production build to reduce app size
  //make sure webpack bundles those and don't exclude them
  //skip this in dev mode since it slows down the bundling
  function getExcludedNodeModules() {
    return packageJson.build.files
      .map((pattern) => pattern.match(/\!node_modules\/(.+)/))
      .filter((match) => match !== null)
      .map((match) => match[1]);
  }

  // don't bundle external modules from node_modules
  let externals = [];

  if (fs.existsSync('node_modules')) {
    externals = [...externals, ...fs.readdirSync('node_modules')];
  }

  // When building normally in a monorepo
  if (fs.existsSync('../../node_modules')) {
    externals = [...externals, ...fs.readdirSync('../../node_modules')];
  }

  if (production) {
    // ..except these
    getExcludedNodeModules().forEach((m) => {
      const i = externals.indexOf(m);
      if (i !== -1) externals.splice(i, 1);
    });
  }

  return externals;
};

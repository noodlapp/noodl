const merge = require('webpack-merge').default;
const shared = require('./webpack.test.js');

module.exports = merge(shared, {
  watch: false
});

//Note: this files has to be javascript and require until the main process uses webpack+typescript

const _ = require('lodash');

const _nodesSoftEqualOmitProps = ['x', 'y', 'dynamicports', 'metadata', 'conflicts'];
const _nodesSoftEqualOmitPropsRootNodes = _nodesSoftEqualOmitProps.concat('_sort');

function nodesSoftEqual(a, b) {
  //_sort and _parent are extra attribute added by the diff code. _sort is the child index
  //we don't want to show root nodes as "Changed" if the _sort paramters differs, but we do for nodes with parents
  //(to cover the case where siblings have been rearranged without any other changes)
  const areRootNodes = !a._parent && !b._parent;

  const propsToOmit = areRootNodes ? _nodesSoftEqualOmitPropsRootNodes : _nodesSoftEqualOmitProps;

  return _.isEqual(_.omit(a, propsToOmit), _.omit(b, propsToOmit));
}

module.exports = {
  nodesSoftEqual
};

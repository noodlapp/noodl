import { nodesSoftEqual } from './projectmerger.nodeequals';

const { isDeepStrictEqual } = require('util');
const _ = require('lodash');

type Project = TSFixme;

export interface ArrayDiff<T> {
  deleted: T[];
  created: T[];
  changed: T[];
  unchanged: T[];
}
export function createEmptyArrayDiff<T>(): ArrayDiff<T> {
  return {
    deleted: [],
    created: [],
    changed: [],
    unchanged: [],
  }
}

export interface ProjectDiffItem {
  graph: TSFixme;
  id: string;
  name: string;
  metadata: TSFixme;
}

export interface ProjectBasicDiffItem {
  name: string;
  value: any;
  oldValue?: any;
}

export interface ProjectDiff {
  components: ArrayDiff<ProjectDiffItem>;
  variants: ArrayDiff<TSFixme>;
  settings: ArrayDiff<ProjectBasicDiffItem>;
  styles: {
    colors: ArrayDiff<ProjectBasicDiffItem>;
    text: ArrayDiff<ProjectBasicDiffItem>;
  };
  cloudservices: ArrayDiff<ProjectBasicDiffItem>;
}

function diff(_base, _current, keyFunc, diffFunc) {
  const created = [],
    deleted = [],
    changed = [],
    unchanged = [];

  // Lookups based on key
  const base = {},
    current = {};
  for (var i in _base) base[keyFunc(_base[i])] = _base[i];

  for (var i in _current) current[keyFunc(_current[i])] = _current[i];

  const names = {};
  for (var key in base) names[key] = true;

  for (var key in current) names[key] = true;

  for (var key in names) {
    if (base[key] === undefined && current[key] !== undefined) {
      // Component created
      created.push(current[key]);
    } else if (base[key] !== undefined && current[key] === undefined) {
      // Component deleted
      deleted.push(base[key]);
    } else {
      var changes = diffFunc(base[key], current[key]);
      if (changes !== undefined) {
        // Component has changes
        changed.push(changes);
      } else {
        unchanged.push(current[key]);
      }
    }
  }

  return {
    deleted: deleted,
    created: created,
    changed: changed,
    unchanged: unchanged
  };
}

function diffConnections(base, current) {
  function key(c) {
    return c.fromId + ':' + c.fromProperty + '-' + c.toId + ':' + c.toProperty;
  }

  function diffFunc(b, c) {
    return;
  }

  var d = diff(base, current, key, diffFunc);
  d.deleted.forEach((c) => {
    c.annotation = 'Deleted';
  });
  d.created.forEach((c) => {
    c.annotation = 'Created';
  });

  const changes = d.deleted.concat(d.unchanged.concat(d.created));
  return {
    connections: changes,
    hasModifications: d.deleted.length + d.created.length > 0
  };
}

function diffNodes(base, current) {
  // Flatten node heirarchy (store parent reference)
  function collectNodes(nodes, parent?, list?) {
    if (!nodes) return;
    if (!list) list = [];

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (parent) n._parent = parent.id;
      n._sort = i;

      list.push(n);
      collectNodes(n.children, n, list);
      delete n.children; // Remove children, creating a flattened list
    }
    return list;
  }
  var baseFlattened = collectNodes(base);
  var currentFlattened = collectNodes(current);

  // Merge all nodes
  function key(o) {
    return o.id;
  }

  function diffNode(base, current) {
    if (nodesSoftEqual(base, current)) return;
    // No change
    else {
      current.diffData = { parent: base };
      return current;
    }
  }

  var d = diff(baseFlattened, currentFlattened, key, diffNode);

  d.deleted.forEach((n) => {
    n.annotation = 'Deleted';
  });
  d.created.forEach((n) => {
    n.annotation = 'Created';
  });
  d.changed.forEach((n) => {
    n.annotation = 'Changed';
  });

  var res = d.unchanged.concat(d.changed.concat(d.deleted.concat(d.created)));

  // Recreate the hierarchy
  function collectChildren(node) {
    var id = node.id;
    var children = [];
    for (var i in res) {
      if (res[i]._parent === id) children.push(res[i]);
    }
    children.sort(function (a, b) {
      return a._sort > b._sort ? 1 : -1;
    });
    return children.length > 0 ? children : undefined;
  }

  for (var i in res) {
    var n = res[i];
    n.children = collectChildren(n);
  }

  // Delete temporary keys and store all roots
  var roots = [];
  for (var i in res) {
    if (!res[i]._parent) roots.push(res[i]);

    delete res[i]._parent;
    delete res[i]._sort;
  }

  return {
    roots,
    hasModifications: d.changed.length + d.deleted.length + d.created.length > 0
  };
}

function diffComments(base, current) {
  function diffComment(base, current) {
    const propsToOmit = ['x', 'y', 'width', 'height'];

    if (_.isEqual(_.omit(base, propsToOmit), _.omit(current, propsToOmit))) return;
    // No change
    else {
      current.diffData = { parent: base };
      return current;
    }
  }

  var d = diff(base, current, (c) => c.id, diffComment);

  d.deleted.forEach((n) => {
    n.annotation = 'deleted';
  });
  d.created.forEach((n) => {
    n.annotation = 'created';
  });
  d.changed.forEach((n) => {
    n.annotation = 'changed';
  });

  return {
    comments: d.unchanged.concat(d.changed.concat(d.deleted.concat(d.created))),
    hasModifications: d.changed.length + d.deleted.length + d.created.length > 0
  };
}

function diffComponent(base, current) {
  const changes: any = {
    graph: {
      connections: []
    }
  };

  const connDiff = diffConnections(base.graph.connections, current.graph.connections);
  const rootDiff = diffNodes(base.graph.roots, current.graph.roots);
  const commentDiff = diffComments(base.graph.comments, current.graph.comments);

  // First find delete and created connections
  changes.graph.connections = connDiff.connections;

  // Find deleted, created and changed nodes
  changes.graph.roots = rootDiff.roots;

  changes.graph.comments = commentDiff.comments;

  changes.name = current.name;
  changes.id = current.id;
  changes.metadata = current.metadata;

  return connDiff.hasModifications || rootDiff.hasModifications || commentDiff.hasModifications ? changes : undefined;
}

function diffComponents(baseComponents, currentComponents) {
  function key(o) {
    return o.id || o.name;
  }

  return diff(baseComponents, currentComponents, key, diffComponent);
}

function diffVariant(base, current) {
  if (!_.isEqual(base, current)) return { name: current.name, typename: current.typename };
}

function diffVariants(baseVariants = [], currentVariants = []) {
  function key(v) {
    return v.typename + ':' + (v.name || '$default');
  }

  return diff(baseVariants, currentVariants, key, diffVariant);
}

//diff two Objects and return diff as {name, value} for each prop
function diffPlainObject(base, current, propsToIgnore?: string[]) {
  const created = [];
  const deleted = [];
  const changed = [];
  const unchanged = [];

  const props = new Set(
    Object.keys(base)
      .concat(Object.keys(current))
      .filter((prop) => !propsToIgnore || propsToIgnore.includes(prop) === false)
  );

  for (const key of props) {
    const keyValue = { name: key, value: current[key] };

    if (base[key] === undefined && current[key] !== undefined) {
      created.push(keyValue);
    } else if (base[key] !== undefined && current[key] === undefined) {
      deleted.push({ ...keyValue, oldValue: base[key] });
    } else {
      const isEqual = isDeepStrictEqual(current[key], base[key]);
      if (!isEqual) {
        changed.push({ ...keyValue, oldValue: base[key] });
      } else {
        unchanged.push(keyValue);
      }
    }
  }

  return {
    deleted: deleted,
    created: created,
    changed: changed,
    unchanged: unchanged
  };
}

export function diffProject(base: Project, current: Project): ProjectDiff {
  //objects will be modified, so make a copy
  base = JSON.parse(JSON.stringify(base));
  current = JSON.parse(JSON.stringify(current));

  return {
    components: diffComponents(base.components, current.components),
    variants: diffVariants(base.variants, current.variants),
    settings: diffPlainObject(base.settings || {}, current.settings || {}),
    styles: {
      colors: diffPlainObject(base.metadata?.styles?.colors || {}, current.metadata?.styles?.colors || {}),
      text: diffPlainObject(base.metadata?.styles?.text || {}, current.metadata?.styles?.text || {})
    },
    cloudservices: diffPlainObject(
      { cloudservice: base.metadata?.cloudservices },
      { cloudservice: current.metadata?.cloudservices },
      ['instanceId']
    )
  };
}

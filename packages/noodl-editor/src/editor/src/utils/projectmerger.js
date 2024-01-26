//Note: this files has to be javascript and require until the main process uses webpack+typescript

const { nodesSoftEqual } = require('./projectmerger.nodeequals');

const _ = require('lodash');
const diff3 = require('diff3');
const ProjectValidator = require('./projectvalidator');

function mergeSourceCode(ancestor, ours, theirs) {
  var _o = ours.split(/\r?\n/);
  var _a = ancestor.split(/\r?\n/);
  var _t = theirs.split(/\r?\n/);

  //diff3 takes these arguments: A, O, B
  //A and B are independently derived from O
  //So we set A=ours, O=ancestor, B=theirs
  var diff = diff3(_o, _a, _t);
  let hasConflicts = false;

  var merged = '';
  for (var j = 0; j < diff.length; j++) {
    var d = diff[j];
    if (d.ok) {
      merged += d.ok.join('\n');
    } else if (d.conflict) {
      merged += '\n------------- Original -------------\n';
      merged += d.conflict.o.join('\n');
      merged += '\n------------- Ours -------------\n';
      merged += d.conflict.a.join('\n');
      merged += '\n------------- Theirs -------------\n';
      merged += d.conflict.b.join('\n');
      merged += '\n-------------\n';

      hasConflicts = true;
    }
  }

  return { merged, hasConflicts };
}

function merge(ancestors, ours, theirs, key, mergefunc) {
  // Create lookup tables for components based on name
  var a = {},
    o = {},
    t = {};
  for (var i in ancestors) a[key(ancestors[i])] = ancestors[i];

  for (var i in ours) o[key(ours[i])] = ours[i];

  for (var i in theirs) t[key(theirs[i])] = theirs[i];

  // Collect all names
  var names = {};
  for (var i in ours) names[key(ours[i])] = true;

  for (var i in theirs) names[key(theirs[i])] = true;

  // Loop over all component names
  for (var name in names) {
    // Components doesn't match, there is a change
    if (!_.isEqual(o[name], t[name])) {
      // Their have not changed, use ours
      if (_.isEqual(t[name], a[name])) {
        continue;
      }
      // Ours have not changed, use theirs
      else if (_.isEqual(o[name], a[name])) {
        o[name] = t[name];
      }
      // Both have change merge
      else {
        o[name] = mergefunc(a[name], o[name], t[name], name);
      }
    }
  }

  var res = [];
  for (var i in o) if (o[i]) res.push(o[i]);

  return res;
}

function mergeSingle(a, o, t, mergefunc) {
  if (!_.isEqual(o, t)) {
    if (_.isEqual(t, a)) {
      return o;
    }

    if (_.isEqual(o, a)) {
      return t;
    }

    return mergefunc(a, o, t);
  }
  return o;
}

// Merges JSON but does not handle conflicts, in that case "our" value will prevail
function mergeJSON(_ancestor_node, _our_node, _their_node) {
  var ancestor_node = _ancestor_node || {};
  var our_node = _our_node || {};
  var their_node = _their_node || {};

  var keys = {};
  for (var key in our_node) keys[key] = true;
  for (var key in their_node) keys[key] = true;

  //Go through each key...
  for (var key in keys) {
    //Get the values at that key for the three objects
    var ancestor_value = ancestor_node[key];
    var our_value = our_node[key];
    var their_value = their_node[key];

    //If there's a discrepency...
    if (our_value != their_value)
      if (_.isEqual(their_value, ancestor_value))
        //if theirs matches the ancestor, go with ours
        //no action is needed in this case
        continue;
      //if ours matches the ancestor, go with theirs
      else if (_.isEqual(our_value, ancestor_value))
        //We write the value to our_node since we're going to overwrite
        //our version with the merged version
        our_node[key] = their_value;
      //if both ours and theirs are objects, recurse into them
      else if (our_value && their_value && typeof our_value === 'object' && typeof their_value === 'object')
        mergeJSON(ancestor_value, our_value, their_value);
  }
}

// Merge connections in a component
function mergeConnections(ancestors, ours, theirs) {
  function key(c) {
    return c.fromId + ':' + c.fromProperty + '-' + c.toId + ':' + c.toProperty;
  }

  function mergeFunc(a, o, t) {
    return o;
  }

  return merge(ancestors, ours, theirs, key, mergeFunc);
}

// Merge node
function _mergeParameters(a, o, t, mergeFunc) {
  var names = {};
  for (var i in o) names[i] = true;

  for (var i in t) names[i] = true;

  // Loop over all parameter names
  for (var name in names) {
    // Components doesn't match, there is a change
    if (!_.isEqual(o[name], t[name])) {
      // Their have not changed, use ours
      if (_.isEqual(t[name], a[name])) {
        continue;
      }
      // Ours have not changed, use theirs
      else if (_.isEqual(o[name], a[name])) {
        o[name] = t[name];
      }
      // Both have changed report conflict
      else {
        o[name] = mergeFunc(a[name], o[name], t[name], name);
      }
    }
  }

  return o;
}

function mergeNode(ancestors, ours, theirs) {
  if (ours === undefined) {
    // Ours have been deleted, see if they have any changes
    if (nodesSoftEqual(ancestors, theirs)) return undefined;
    // They don't have any changes worth keeping, remove it
    else return theirs; // Ours is deleted, but theirs have changes, use theirs
  }

  if (theirs === undefined) {
    // Theirs have been deleted, make sure we have changes other than (x,y) to keep our node
    if (nodesSoftEqual(ancestors, ours)) return undefined;
    // We are equal to ancestor, e.g. no change, let the node delete
    else return ours; // We have changes, keep our node
  }

  var conflicts = [];

  function isSourceCodePort(name) {
    if (
      ours.metadata?.merge?.soureCodePorts?.includes(name) ||
      theirs.metadata?.merge?.soureCodePorts?.includes(name)
    ) {
      return true;
    }

    return false;
  }

  // Merge parameters
  ours.parameters = _mergeParameters(
    ancestors ? ancestors.parameters : {},
    ours.parameters,
    theirs.parameters,
    (a, o, t, name) => {
      if (isSourceCodePort(name)) {
        if (!a) {
          console.warn('No ancestor when merging source code in node', ours.id);
          return o; //ours will overwrite their changes
        }

        // Attempt to merge source code
        const { merged, hasConflicts } = mergeSourceCode(a, o, t);
        o = merged;

        if (hasConflicts) {
          conflicts.push({
            type: 'sourceCode',
            name: name,
            oursDisplayName: '[Source code]',
            theirsDisplayName: '[Source code]',
            ours: o,
            theirs: t
          });
        }
      } else
        conflicts.push({
          type: 'parameter',
          name: name,
          ours: o,
          theirs: t
        });

      return o;
    }
  );

  // Any of the nodes have state paramters
  if (ours.stateParameters || theirs.stateParameters || (ancestors && ancestors.stateParameters)) {
    ours.stateParameters = _mergeParameters(
      ancestors && ancestors.stateParameters ? ancestors.stateParameters : {},
      ours.stateParameters || {},
      theirs.stateParameters || {},
      (a, o, t, state) => {
        return _mergeParameters(a || {}, o || {}, t || {}, (a, o, t, name) => {
          conflicts.push({
            type: 'stateParameter',
            state: state,
            name: name,
            ours: o,
            theirs: t
          });

          return o;
        });
      }
    );
  }

  // Merge any state transitions
  if (ours.stateTransitions || theirs.stateTransitions || (ancestors && ancestors.stateTransitions)) {
    ours.stateTransitions = _mergeParameters(
      ancestors && ancestors.stateTransitions ? ancestors.stateTransitions : {},
      ours.stateTransitions || {},
      theirs.stateTransitions || {},
      (a, o, t, state) => {
        return _mergeParameters(a || {}, o || {}, t || {}, (a, o, t, name) => {
          conflicts.push({
            type: 'stateTransition',
            state: state,
            name: name,
            ours: o,
            theirs: t
          });

          return o;
        });
      }
    );
  }

  // Merge default state transition
  if (
    ours.defaultStateTransitions ||
    theirs.defaultStateTransitions ||
    (ancestors && ancestors.defaultStateTransitions)
  ) {
    ours.defaultStateTransitions = _mergeParameters(
      ancestors && ancestors.defaultStateTransitions ? ancestors.defaultStateTransitions : {},
      ours.defaultStateTransitions || {},
      theirs.defaultStateTransitions || {},
      (a, o, t, state) => {
        conflicts.push({
          type: 'defaultStateTransition',
          state: state,
          ours: o,
          theirs: t
        });
        return o;
      }
    );
  }

  // Merge variant
  if (ours.variant || theirs.variant || (ancestors && ancestors.variant)) {
    ours.variant = mergeSingle(ancestors ? ancestors.variant : undefined, ours.variant, theirs.variant, (a, o, t) => {
      conflicts.push({
        type: 'variant',
        ours: o,
        theirs: t
      });
      return o;
    });
  }

  // Merge type
  ours.type = mergeSingle(ancestors ? ancestors.type : undefined, ours.type, theirs.type, (a, o, t) => {
    conflicts.push({
      type: 'typename',
      ours: ours.type,
      theirs: theirs.type
    });
    return o;
  });

  // Finally we must merge ports
  function key(o) {
    return o.name;
  }

  // Merge ports by using ours
  function mergePort(a, o, t) {
    return o;
  }

  ours.ports = merge(ancestors ? ancestors.ports : [], ours.ports, theirs.ports, key, mergePort);

  if (conflicts.length > 0) ours.conflicts = conflicts;
  else delete ours.conflicts;

  return ours;
}

// Merge nodes
function mergeNodes(ancestors, ours, theirs) {
  // Flatten node heirarchy (store parent reference)
  function collectNodes(nodes, parent, list) {
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
  var ancestorsFlattened = collectNodes(ancestors);
  var oursFlattened = collectNodes(ours);
  var theirsFlattened = collectNodes(theirs);

  // Merge all nodes
  function key(o) {
    return o.id;
  }

  var res = merge(ancestorsFlattened, oursFlattened, theirsFlattened, key, mergeNode);

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

  return roots;
}

// Compare comments by only looking at the text
function _commentSoftEqual(a, b) {
  return a.text === b.text;
}

function mergeComment(ancestors, ours, theirs) {
  if (ours === undefined) {
    // Ours have been deleted, see if they have any changes
    if (_commentSoftEqual(ancestors, theirs)) return undefined;
    // They don't have any changes worth keeping, remove it
    else return theirs; // Ours is deleted, but theirs have changes, use theirs
  }

  if (theirs === undefined) {
    // Theirs have been deleted, see if we have any interesting changes
    if (_commentSoftEqual(ancestors, ours)) {
      return undefined; // We are equal to ancestor, e.g. no change, so delete the comment
    } else {
      return ours; // We have changes, keep our comment
    }
  }

  //is there a difference between ours and theirs?
  if (!_commentSoftEqual(ours, theirs)) {
    if (_commentSoftEqual(ours, ancestors)) {
      //Our hasn't changed, use theirs
      return theirs;
    } else if (_commentSoftEqual(theirs, ancestors)) {
      //Their hasn't changed, so use ours
      return ours;
    } else {
      // Both have changed. Just use ours.
      return ours;
    }
  }

  return ours;
}

function mergeComments(ancestors, ours, theirs) {
  function key(o) {
    return o.id;
  }

  return merge(ancestors, ours, theirs, key, mergeComment);
}

// Merge a component, returns a merged component
function mergeComponent(ancestors, ours, theirs) {
  if (ours === undefined) {
    // Ours have been deleted, see if they have any changes
    if (_.isEqual(ancestors, theirs)) return undefined;
    // They don't have any changes, remove it
    else return theirs; // Ours is deleted, but theirs have changes, use theirs
  }

  if (theirs === undefined) {
    // Theirs have been deleted, do  we have changes ?
    if (_.isEqual(ancestors, ours)) return undefined;
    // We are equal to ancestor, e.g. no change, let the component delete
    else return ours; // We have changes, keep our node
  }

  // Merge connections
  ours.graph.connections = mergeConnections(
    ancestors ? ancestors.graph.connections : [],
    ours.graph.connections,
    theirs.graph.connections
  );

  // Merge nodes
  ours.graph.roots = mergeNodes(ancestors ? ancestors.graph.roots : [], ours.graph.roots, theirs.graph.roots);

  // Merge comments
  ours.graph.comments = mergeComments(
    ancestors ? ancestors.graph.comments : [],
    ours.graph.comments,
    theirs.graph.comments
  );

  if (ours.name !== theirs.name) {
    // Check if the component have been renamed
    // TODO: Conflic if both changes
    if (ancestors && ancestors.name === ours.name) ours.name = theirs.name;
  }

  // Merge metadata
  mergeJSON(ancestors === undefined ? {} : ancestors.metadata, ours.metadata, theirs.metadata);

  return ours;
}

// Merge an array of components, returns a new merged array
function mergeComponents(ancestors, ours, theirs) {
  function key(o) {
    return o.id || o.name;
  }

  return merge(ancestors, ours, theirs, key, mergeComponent);
}

// Merge variants
function mergeVariant(ancestors, ours, theirs) {
  if (ours === undefined) {
    // Ours have been deleted, see if they have any changes
    if (_.isEqual(ancestors, theirs)) return undefined;
    // They don't have any changes worth keeping, remove it
    else return theirs; // Ours is deleted, but theirs have changes, use theirs
  }

  if (theirs === undefined) {
    // Theirs have been deleted, make sure we have changes other than (x,y) to keep our node
    if (_.isEqual(ancestors, ours)) return undefined;
    // We are equal to ancestor, e.g. no change, let the node delete
    else return ours; // We have changes, keep our node
  }

  var conflicts = [];

  // Merge parameters
  ours.parameters = _mergeParameters(
    ancestors ? ancestors.parameters : {},
    ours.parameters,
    theirs.parameters,
    (a, o, t, name) => {
      conflicts.push({
        type: 'parameter',
        name: name,
        ours: o,
        theirs: t
      });

      return o;
    }
  );

  // Any of the nodes have state paramters
  if (ours.stateParameters || theirs.stateParameters || (ancestors && ancestors.stateParameters)) {
    ours.stateParameters = _mergeParameters(
      ancestors && ancestors.stateParameters ? ancestors.stateParameters : {},
      ours.stateParameters || {},
      theirs.stateParameters || {},
      (a, o, t, state) => {
        return _mergeParameters(a || {}, o || {}, t || {}, (a, o, t, name) => {
          conflicts.push({
            type: 'stateParameter',
            state: state,
            name: name,
            ours: o,
            theirs: t
          });

          return o;
        });
      }
    );
  }

  // Merge any state transitions
  if (ours.stateTransitions || theirs.stateTransitions || (ancestors && ancestors.stateTransitions)) {
    ours.stateTransitions = _mergeParameters(
      ancestors && ancestors.stateTransitions ? ancestors.stateTransitions : {},
      ours.stateTransitions || {},
      theirs.stateTransitions || {},
      (a, o, t, state) => {
        return _mergeParameters(a || {}, o || {}, t || {}, (a, o, t, name) => {
          conflicts.push({
            type: 'stateTransition',
            state: state,
            name: name,
            ours: o,
            theirs: t
          });

          return o;
        });
      }
    );
  }

  // Merge default state transition
  if (
    ours.defaultStateTransitions ||
    theirs.defaultStateTransitions ||
    (ancestors && ancestors.defaultStateTransitions)
  ) {
    ours.defaultStateTransitions = _mergeParameters(
      ancestors && ancestors.defaultStateTransitions ? ancestors.defaultStateTransitions : {},
      ours.defaultStateTransitions || {},
      theirs.defaultStateTransitions || {},
      (a, o, t, state) => {
        conflicts.push({
          type: 'defaultStateTransition',
          state: state,
          ours: o,
          theirs: t
        });
        return o;
      }
    );
  }

  if (conflicts.length > 0) ours.conflicts = conflicts;
  else delete ours.conflicts;

  return ours;
}

// Merge an array of variants, returns a new merged array
function mergeVariants(ancestors, ours, theirs) {
  function key(o) {
    return o.typename + '/' + o.name;
  }

  return merge(ancestors, ours, theirs, key, mergeVariant);
}

function mergeProject(ancestors, ours, theirs) {
  // Detach components
  var ancestorComponents = ancestors.components;
  ancestors.components = undefined;

  var ourComponents = ours.components;
  ours.components = undefined;

  var theirComponents = theirs.components;
  theirs.components = undefined;

  // Detach variants
  var ancestorVariants = ancestors.variants;
  ancestors.variants = undefined;

  var ourVariants = ours.variants;
  ours.variants = undefined;

  var theirVariants = theirs.variants;
  theirs.variants = undefined;

  // Merge project without components
  mergeJSON(ancestors, ours, theirs);

  // Merge components
  ours.components = mergeComponents(ancestorComponents, ourComponents, theirComponents);

  // Merge variants
  ours.variants = mergeVariants(ancestorVariants, ourVariants, theirVariants);
  if (ours.variants !== undefined && ours.variants.length === 0) delete ours.variants;

  // Validate project
  const validator = new ProjectValidator();
  validator.validate(ours);

  if (validator.hasErrors()) {
    validator.fix();
  }

  return ours;
}

module.exports = {
  mergeProject
};

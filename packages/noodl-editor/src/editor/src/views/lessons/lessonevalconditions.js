const { ProjectModel } = require('../../models/projectmodel');
const _ = require('underscore');
const assert = require('assert');
const { NodeGraphContextTmp } = require('../../contexts/NodeGraphContext/NodeGraphContext');

function splitAndTrim(stringList) {
  if (!stringList) return [];

  return stringList.split(',').map((s) => s.trim());
}

//modified version of underscores isMatch to support arrays
function isMatch(object, attrs) {
  var _keys = Object.keys(attrs),
    length = _keys.length;
  if (object == null) return !length;
  var obj = Object(object);
  for (var i = 0; i < length; i++) {
    var key = _keys[i];
    if (!(key in obj)) return false;

    if (Array.isArray(attrs[key]) && Array.isArray(obj[key])) {
      const a = attrs[key];
      const b = obj[key];
      return a.length == b.length && _.difference(a, b).length == 0;
    }
    if (attrs[key] !== obj[key] || !(key in obj)) return false;
  }
  return true;
}

function getPortType(node, paramName) {
  const port = node.getPort(paramName, 'input');
  return port?.type?.name || port?.type;
}

function evalConditions(conditions) {
  const currentViewerPath = window.noodlEditorPreviewRoute;

  for (var i in conditions) {
    var cond = conditions[i];

    if (cond['hastype'] !== undefined) {
      // Check that a node exists and have correct type
      var node = findNodeWithPath(cond['path']);
      if (node && node.type && node.type.name.toLowerCase() === cond['hastype'].toLowerCase()) cond.completed = true;
    } else if (cond['hasport'] !== undefined) {
      var node = findNodeWithPath(cond['path']);
      if (!node) continue;

      _.each(node.ports, function (p) {
        if (p.name.toLowerCase() === cond['hasport'].toLowerCase()) cond.completed = true;
      });
    } else if (cond['haslabel'] !== undefined) {
      // Make sure a node has correct label
      var node = findNodeWithPath(cond['path']);
      if (node && node.label.toLowerCase() === cond['haslabel'].toLowerCase()) cond.completed = true;
    } else if (cond['exists'] !== undefined) {
      // Make sure a node or component exist
      var node = findNodeWithPath(cond['path']);
      if (cond['exists'] === true && node !== undefined) cond.completed = true;
      if (cond['exists'] === false && node === undefined) cond.completed = true;
    } else if (cond['isvisualroot'] !== undefined) {
      // Make sure a node or component exist
      var node = findNodeWithPath(cond['path']);
      if (cond['isvisualroot'] === true && node === ProjectModel.instance.getRootNode()) cond.completed = true;
      if (cond['isvisualroot'] === false && node !== ProjectModel.instance.getRootNode()) cond.completed = true;
    } else if (cond['hasparams'] !== undefined) {
      // Make sure a node has parameters
      var node = findNodeWithPath(cond['path']);
      if (!node) continue;

      // Must compare case insensitive
      function hasParam(name) {
        for (var i in node.parameters) if (i.toLowerCase() === name.toLowerCase()) return true;

        return false;
      }

      var params = splitAndTrim(cond['hasparams']);
      cond.completed = true;
      for (var i in params) {
        if (!hasParam(params[i])) cond.completed = false;
      }
    } else if (cond['paramseq'] !== undefined) {
      // Make sure params equals specified params
      var node = findNodeWithPath(cond['path']);
      if (!node) continue;

      function isParamEqual(paramName, paramValue) {
        for (var i in node.parameters) {
          // Parameter name is case insensitive
          if (i.toLowerCase() === paramName.toLowerCase()) {
            //is the paramter an object? do a isMatch comparison (objA has all properties in objB)
            if (typeof node.parameters[i] === 'object' && isMatch(node.parameters[i], paramValue)) {
              return true;
            } else if (getPortType(node, paramName) === 'array') {
              //parse as js and check for equality
              try {
                const nodeVal = eval(node.parameters[i]);
                const paramVal = eval(paramValue);
                assert.deepStrictEqual(nodeVal, paramVal); //throws if not equal
                return true;
              } catch (_) {
                return false;
              }
            } else if (getPortType(node, paramName) === 'stringlist') {
              //string lists have the form "a,b,c" and the order shouldn't matter
              const nodeVal = (node.parameters[i] || '').split(',');
              const paramVal = (paramValue || '').split(',');

              //bit of a trick, but if we sort the arrays and join them they should be idential if all the elements are the same
              return nodeVal.sort().join(',') === paramVal.sort().join(',');
            }
            //are both paramters strings? compare case insensitive
            else if (
              node.parameters[i].toLowerCase &&
              paramValue.toLowerCase &&
              node.parameters[i].toLowerCase() === paramValue.toLowerCase()
            ) {
              return true;
            }
            //otherwise just a standard compare
            else if (node.parameters[i] === paramValue) {
              return true;
            }
          }
        }
      }

      cond.completed = true;
      var params = cond['paramseq'];
      for (var i in params) {
        if (!isParamEqual(i, params[i])) cond.completed = false;
      }
    } else if (cond['hasconnection'] !== undefined) {
      if (!cond['to']) throw new Error("'hasconnection' condition is missing a 'to' property");
      if (!cond['from']) throw new Error("'hasconnection' condition is missing a 'from' property");

      // Make sure that a connection exist in the direction
      var from = findNodeWithPath(cond['from']);
      if (!from) continue;

      var to = findNodeWithPath(cond['to']);
      if (!to) continue;

      var ports = splitAndTrim(cond['hasconnection']);
      from.forAllConnectionsOnThisNode(function (c) {
        if (
          c.fromId === from.id &&
          c.toId === to.id &&
          c.fromProperty.toLowerCase() === ports[0].toLowerCase() &&
          c.toProperty.toLowerCase() === ports[1].toLowerCase()
        ) {
          cond.completed = true;
        }
      });
    } else if (cond['metadata'] !== undefined) {
      var path = cond['metadata'].split(':');
      var data = ProjectModel.instance.getMetaData(path[0]);
      if (data && data[path[1]] === cond['equals']) cond.completed = true;
    } else if (cond['viewerpatheq'] !== undefined) {
      if (cond['viewerpatheq'] === currentViewerPath) cond.completed = true;
    } else if (cond['activecomponentnameeq'] !== undefined) {
      const activeComponent = NodeGraphContextTmp.nodeGraph.getActiveComponent();
      if (cond['activecomponentnameeq'] === activeComponent.name) cond.completed = true;
    }
  }

  // Are all conditions met?
  var res = true;
  for (var i in conditions) res = res && conditions[i].completed === true;

  return res;
}

function findNodeWithPath(path) {
  var tokens = path.split(':');

  function findNodeThatMatches(nodes, tokens, index) {
    var ref = tokens[index];
    var lastToken = index === tokens.length - 1;

    if (ref[0] === '#') {
      var label = ref.substring(1);

      for (var i in nodes)
        if (nodes[i].label.toLowerCase() === label.toLowerCase())
          return lastToken ? nodes[i] : findNodeThatMatches(nodes[i].children, tokens, index + 1);
    } else if (ref[0] === '%') {
      var typename = ref.substring(1);

      for (var i in nodes)
        if (nodes[i].type && nodes[i].type.name.toLowerCase() === typename.toLowerCase())
          return lastToken ? nodes[i] : findNodeThatMatches(nodes[i].children, tokens, index + 1);
    } else {
      var idx = parseFloat(ref);

      return lastToken ? nodes[idx] : findNodeThatMatches(nodes[idx].children, tokens, index + 1);
    }
  }

  var component;
  _.each(ProjectModel.instance.components, function (c) {
    if (c.name.toLowerCase() === tokens[0].toLowerCase()) component = c;
  });
  if (!component) return;

  return tokens.length === 1 ? component : findNodeThatMatches(component.graph.roots, tokens, 1);
}

module.exports = evalConditions;

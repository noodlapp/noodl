const { ProjectModel } = require('../models/projectmodel');

function matchStrings(string1, string2) {
  return string1.toLowerCase().indexOf(string2.toLowerCase()) !== -1;
}

function searchInNodeRecursive(node, searchTerms, component) {
  var results = [];
  var matchLabel = null;
  var i = 0;

  if (node._label !== undefined && matchStrings(node._label, searchTerms)) {
    matchLabel = node.label;
  } else if (matchStrings(node.id, searchTerms)) {
    matchLabel = node.id;
  } else if (matchStrings(node.type.displayName || node.type.name, searchTerms)) {
    matchLabel = node.label;
  } else {
    let parameterNames = Object.keys(node.parameters);
    for (const parameterNameIndex in parameterNames) {
      const parameterName = parameterNames[parameterNameIndex];

      if (
        typeof node.parameters[parameterName] === 'string' &&
        matchStrings(node.parameters[parameterName], searchTerms)
      ) {
        let displayLabel = parameterName;
        let connectionPort = node.type.ports?.find((port) => port.name === parameterName);
        if (connectionPort) {
          displayLabel = connectionPort.displayName;
        }

        if (node.type.name === 'Javascript2' && parameterName === 'code') {
          matchLabel = 'In the code';
        } else if (node.type.name === 'Expression' && parameterName === 'expression') {
          matchLabel = 'In the expression';
        } else if (node.type.name === 'For Each' && parameterName === 'templateScript') {
          matchLabel = 'In the template script';
        } else if (node.type.name === 'REST' && parameterName === 'code') {
          matchLabel = 'In the script';
        } else if (node.type.name === 'Model' && parameterName === 'properties') {
          matchLabel = displayLabel;
        } else if (node.type.name === 'States' && parameterName === 'states') {
          matchLabel = displayLabel;
        } else {
          matchLabel = displayLabel + ': ' + node.parameters[parameterName];
        }

        break;
      }
    }

    if (matchLabel === null) {
      var ports = node.dynamicports;
      for (i = 0; i < ports.length; ++i) {
        var port = ports[i];
        if (matchStrings(port.name, searchTerms)) {
          matchLabel = node.label + ' : ' + port.name;
          break;
        }
      }
    }

    if (matchLabel === null) {
      var ports = node.ports;
      for (i = 0; i < ports.length; ++i) {
        var port = ports[i];
        if (matchStrings(port.name, searchTerms)) {
          matchLabel = node.label + ' : ' + port.name;
          break;
        }
      }
    }
  }

  if (matchLabel !== null) {
    results.push({
      componentTarget: component,
      nodeTarget: node,
      type: node.type.displayName || node.type.name,
      userLabel: node._label,
      label: matchLabel
    });
  }

  for (i = 0; i < node.children.length; ++i) {
    var child = node.children[i];
    var childResults = searchInNodeRecursive(child, searchTerms, component);
    results = results.concat(childResults);
  }

  return results;
}

function searchInComponent(component, searchTerms) {
  var results = [];
  if (matchStrings(component.displayName, searchTerms)) {
    results.push({
      componentTarget: component,
      type: 'Component',
      label: component.displayName
    });
  }

  for (var i = 0; i < component.graph.roots.length; ++i) {
    var node = component.graph.roots[i];
    var nodeResults = searchInNodeRecursive(node, searchTerms, component);
    results = results.concat(nodeResults);
  }

  if (component.graph.commentsModel.comments) {
    for (var i = 0; i < component.graph.commentsModel.comments.length; ++i) {
      const comment = component.graph.commentsModel.comments[i];
      if (matchStrings(comment.text, searchTerms)) {
        results.push({
          componentTarget: component,
          type: 'Comment',
          label: comment.text
        });
      }
    }
  }

  if (results.length > 0) {
    return {
      componentName: component.displayName,
      componentId: component.id,
      results: results
    };
  } else {
    return null;
  }
}

export function performSearch(searchTerms) {
  var results = [];
  var root = ProjectModel.instance.getRootNode();
  if (root === undefined) return;

  var components = ProjectModel.instance.components;

  for (var i = 0; i < components.length; ++i) {
    var component = components[i];

    var componentResults = searchInComponent(component, searchTerms);
    if (componentResults !== null) {
      //limit the label length (it can search in markdown, css, etc)
      for (const result of componentResults.results) {
        if (result.label?.length > 100) {
          result.label = result.label.substring(0, 100) + '...';
        }
      }

      results.push(componentResults);
    }
  }

  return results;
}

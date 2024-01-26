'use strict';

const Model = require('@noodl/runtime/src/model');
const NoodlRuntime = require('@noodl/runtime');
const JavascriptNodeParser = require('@noodl/runtime/src/javascriptnodeparser');

//Cloud functions override some of the JavascriptNodeParser functions

//Override getComponentScopeForNode to just return an empty object. This basically disabled the 'Component' API in Function/Script nodes and removes a massive memory leak
//Also improves performance.
const componentScope = {};
JavascriptNodeParser.getComponentScopeForNode = function () {
  return componentScope;
};

//override the Noodl API so it uses a model scope
JavascriptNodeParser.createNoodlAPI = function (modelScope) {
  return {
    getProjectSettings: NoodlRuntime.instance.getProjectSettings.bind(NoodlRuntime.instance),
    getMetaData: NoodlRuntime.instance.getMetaData.bind(NoodlRuntime.instance),
    Object: modelScope || Model,
    Variables: (modelScope || Model).get('--ndl--global-variables'),
    Records: require('@noodl/runtime/src/api/records')(modelScope),
    Users: require('./api/users')(modelScope),
    //   CloudFunctions: require('./api/cloudfunctions'),
    Files: require('./api/files'),
    Objects: new Proxy(modelScope || Model, {
      get(target, prop, receiver) {
        return (modelScope || Model).get(prop);
      },
      set(obj, prop, value) {
        (modelScope || Model).get(prop).setAll(value);
      }
    })
  };
};

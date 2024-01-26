'use strict';

import { SeoApi } from './api/seo';

export default function createNoodlAPI(noodlRuntime) {
  // Support SSR
  const global = typeof window !== 'undefined' ? window : globalThis;

  global.Noodl.getProjectSettings = noodlRuntime.getProjectSettings.bind(noodlRuntime);
  global.Noodl.getMetaData = noodlRuntime.getMetaData.bind(noodlRuntime);
  global.Noodl.Collection = global.Noodl.Array = require('@noodl/runtime/src/collection');
  global.Noodl.Model = global.Noodl.Object = require('@noodl/runtime/src/model');
  global.Noodl.Variables = global.Noodl.Object.get('--ndl--global-variables');
  global.Noodl.Events = global.Noodl.eventEmitter = noodlRuntime.context.eventSenderEmitter;
  global.Noodl.Records = require('@noodl/runtime/src/api/records')();
  global.Noodl.Users = require('./api/users');
  global.Noodl.CloudFunctions = require('./api/cloudfunctions');
  global.Noodl.Navigation = require('./api/navigation');
  global.Noodl.Navigation._noodlRuntime = noodlRuntime;
  global.Noodl.Files = require('./api/files');
  global.Noodl.SEO = new SeoApi();
  if (!global.Noodl.Env) {
    global.Noodl.Env = {};
  }

  global.Noodl.Arrays = new Proxy(global.Noodl.Array, {
    get(target, prop, receiver) {
      return Noodl.Array.get(prop);
    },
    set(obj, prop, value) {
      if (!Array.isArray(value)) {
        throw new Error('Cannot assign non array value to array with id ' + prop);
      }
      Noodl.Array.get(prop).set(value);
    }
  });

  global.Noodl.Objects = new Proxy(global.Noodl.Object, {
    get(target, prop, receiver) {
      return Noodl.Object.get(prop);
    },
    set(obj, prop, value) {
      Noodl.Object.get(prop).setAll(value);
    }
  });
}

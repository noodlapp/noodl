import fs from 'fs';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import NodeCache from "node-cache"; 
import { XMLHttpRequest } from 'xmlhttprequest';

const myCache = new NodeCache();
async function cacheFetch(args, callback) {
  const cacheKey = typeof args === 'string' ? args : args.key;
  const cached = myCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const result = await callback();
  myCache.set(cacheKey, result);
  return result;
}

// In the DOM, these are global.
globalThis.React = React;
globalThis.ReactDOM = ReactDOMServer;
globalThis.XMLHttpRequest = XMLHttpRequest;
globalThis.File = class File {};

globalThis.__noodl_modules = [];
globalThis.Noodl = {
  defineModule: function (m) {
    globalThis.__noodl_modules.push(m);
  },
  deployed: true
};

globalThis.projectData = {{#export#}};

// Add some ugly polyfill
globalThis.requestAnimationFrame = (callback) => setImmediate(callback);
globalThis.fetch = async (args) => {
  if (typeof args === 'string') {
    const relativePath = '.' + args;
    if (args.startsWith('/noodl_bundles') && fs.existsSync(relativePath)) {
      const fileContent = await fs.promises.readFile(relativePath, 'utf-8');
      return Promise.resolve({
        status: 200,
        json() {
          return Promise.resolve(JSON.parse(fileContent));
        }
      });
    }
  }
  return await fetch(args);
};

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get(key) {
    return this.store[key] || null;
  }

  set(key, value) {
    this.store[key] = value.toString();
  }

  delete(key) {
    delete this.store[key];
  }

  // Allow direct access like localStorageMock['key']
  get store() {
    return this._store;
  }

  set store(data) {
    this._store = data;
  }
}

globalThis.localStorage = new LocalStorageMock();

// Import the Noodl runtime
require('./noodl.deploy');

// From that file we get some runtime stuff defined on "NoodlSSR"
const { createElement, ssrSetupRuntime } = globalThis.NoodlSSR;

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('public', { index: false }));

function log(...args) {
  // Uncomment to see full request log
  // console.log(...args);
}

let htmlData = '';

async function setup() {
  htmlData = await fs.promises.readFile(path.resolve('./public/index.html'), 'utf8');
}

async function buildPage(path) {
  return new Promise((resolve) => {
    const noodlModules = globalThis.__noodl_modules;
    const projectData = globalThis.projectData;

    // TODO: Maybe fix page router
    globalThis.location = {
      pathname: path,
      search: ""
    }

    log('Create Component...');
    const ViewerComponent = createElement(noodlModules, projectData);
    log('created.');

    const noodlRuntime = ViewerComponent.props.noodlRuntime;

    noodlRuntime.eventEmitter.on('SSR_PageLoading', (id) => {
      console.log('SSR_PageLoading', id);
    });

    noodlRuntime.eventEmitter.on('SSR_PageReady', (id) => {
      console.log('SSR_PageReady', id);
    });

    noodlRuntime.eventEmitter.on('rootComponentUpdated', async () => {
      log('Spin up...');
      noodlRuntime.rootComponent.triggerDidMount();
      for (let index = 0; index < 1000; index++) {
        await new Promise((resolve) => setImmediate(() => resolve(), 0));
        noodlRuntime.rootComponent.triggerDidMount();
        noodlRuntime._doUpdate();
      }
      log('done.');

      log('Rendering...');
      const output1 = ReactDOMServer.renderToString(ViewerComponent);
      log('result:', output1);

      const result = htmlData.replace('<div id="root"></div>', `<div id="root">${output1}</div>`);

      // TODO: Inject Noodl.SEO.meta

      resolve(result);
    });

    log('Setup Runtime...');
    ssrSetupRuntime(noodlRuntime, noodlModules, projectData);
    log('done.');
  });
}

app.get('*', async (req, res) => {
  const path = req.path;
  
  try {
    const cacheKey = `cache__${path}`
    const cached = await cacheFetch(cacheKey, () => buildPage(req.path));
    res.send(cached);
  } catch (error) {
    console.error(error);
    
    // We failed to render SSR, lets just respond with the index.html file, 
    // and then the user should be able to render the page client side.
    res.send(htmlData);
  }
});

setup().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});

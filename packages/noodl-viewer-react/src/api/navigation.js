const { RouterHandler } = require('../nodes/navigation/router-handler');
const NoodlRuntime = require('@noodl/runtime');

const navigation = {
  /**
   * This is set by "packages/noodl-viewer-react/src/noodl-js-api.js"
   * @type {NoodlRuntime}
   */
  _noodlRuntime: undefined,

  async showPopup(componentPath, params) {
    return new Promise((resolve) => {
      navigation._noodlRuntime.context.showPopup(componentPath, params, {
        onClosePopup: (action, results) => {
          resolve({
            action: action?.replace('closeAction-', ''),
            parameters: results
          });
        }
      });
    });
  },

  navigate(routerName, targetPageName, params) {
    RouterHandler.instance.navigate(routerName, {
      target: targetPageName,
      params: params
    });
  },

  navigateToPath(path, options) {
    let hashPath, urlPath;
    var navigationPathType = NoodlRuntime.instance.getProjectSettings()['navigationPathType'];
    if (navigationPathType === undefined || navigationPathType === 'hash') hashPath = path;
    else urlPath = path;

    var query = [];
    if (options && options.query !== undefined) {
      for (let key in options.query) {
        query.push(key + '=' + options.query[key]);
      }
    }

    var compiledUrl =
      (urlPath !== undefined ? urlPath : '') +
      (query.length >= 1 ? '?' + query.join('&') : '') +
      (hashPath !== undefined ? '#' + hashPath : '');

    window.history.pushState({}, '', compiledUrl);
    dispatchEvent(new PopStateEvent('popstate', {}));
  }
};

module.exports = navigation;

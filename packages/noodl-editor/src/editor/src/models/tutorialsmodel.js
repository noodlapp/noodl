const Model = require('../../../shared/model');
const getDocsEndpoint = require('../utils/getDocsEndpoint').default;

class TutorialsModel extends Model {
  constructor() {
    super();
    this.tutorials = [];
  }

  _makeRequest(path, options) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var json;
        try {
          json = JSON.parse(xhr.response);
        } catch (e) {}

        if (xhr.status === 200 || xhr.status === 201) {
          options.success(json);
        } else {
          options.error(json);
        }
      }
    };

    xhr.open(options.method || 'GET', path, true);

    xhr.send();
  }

  absoluteUrl(url) {
    //a tutorial url can either be a relative url in the docs, or an absolute url to something else, e.g. youtube
    if (!url || url.startsWith('http')) {
      return url;
    }

    const endpoint = getDocsEndpoint();
    return endpoint + (url[0] === '/' ? '' : '/') + url;
  }

  getCategories() {
    return Array.from(new Set(this.tutorials.map((t) => t.category || 'Other')));
  }

  list(fn) {
    const endpoint = getDocsEndpoint();
    this._makeRequest(endpoint + '/tutorials/index.json' + '?' + new Date().getTime(), {
      success: (json) => {
        this.tutorials = json;

        fn(json);
      },
      error: () => {
        fn();
      }
    });
  }
}

module.exports = TutorialsModel;

const Model = require('../../../shared/model');
const getDocsEndpoint = require('../utils/getDocsEndpoint').default;

const indexFile = 'index.json';

class LessonTemplatesModel extends Model {
  constructor() {
    super();
    this.templates = [];
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

  // List public modules
  _list(fn) {
    const endpoint = getDocsEndpoint();

    this._makeRequest(endpoint + '/lessons/' + indexFile + '?' + new Date().getTime(), {
      success: (lessons) => {
        lessons.forEach((t) => {
          if (t.url.endsWith('.zip')) {
            // Url is reference to zip file
            t.baseURL = endpoint + '/lessons/' + t.url.split('/').slice(0, -1).join('/') + '/'; // Base Url, e.g. location of project zip file
          } else {
            // Url is assumed to be reference to folder containing the lesson
            t.baseURL = endpoint + '/lessons/' + (t.url.endsWith('/') ? t.url : t.url + '/');
            t.url = t.baseURL + 'project.zip' + (t.version ? '?v=' + t.version : '');
          }

          if (!t.name) t.name = t.url.replace(/:/g, '-').replace(/\//g, '-').replace(/\./g, '-');
        });

        fn(lessons);
      },
      error: () => {
        fn();
      }
    });
  }

  getCategories() {
    return Array.from(new Set(this.templates.map((t) => t.category)));
  }

  fetch() {
    this._list((res) => {
      if (!res) return;

      this.templates = res;

      this.notifyListeners('templatesChanged');
    });
  }

  getTemplates() {
    return this.templates;
  }
}

LessonTemplatesModel.instance = new LessonTemplatesModel();

module.exports = LessonTemplatesModel;

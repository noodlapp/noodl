'use strict';

const { getAbsoluteUrl } = require('@noodl/runtime/src/utils');

function FontLoader() {
  this.loadedFontFamilies = {};
  this.fontCssFamiliesAdded = {};
  this.fontCallbacks = {};

  var self = this;
  ['Arial', 'Arial Black', 'Courier New', 'Helvetica', 'Impact', 'Lucida Console', 'Tahoma', 'Times New Roman'].forEach(
    function (fontFamily) {
      self.loadedFontFamilies[fontFamily] = true;
    }
  );
}

function removeFileEnding(url) {
  return url.replace(/\.[^/.]+$/, '');
}

FontLoader.prototype.loadFont = function (fontURL) {
  // Support SSR
  if (typeof document === 'undefined') return;

  fontURL = getAbsoluteUrl(fontURL);

  //get file name without path and file ending
  var family = removeFileEnding(fontURL).split('/').pop();

  //check if it's already loaded
  if (this.loadedFontFamilies[family]) {
    this.fontCallbacks[family] &&
      this.fontCallbacks[family].forEach(function (callback) {
        callback();
      });
    return;
  }

  //check if font is already being loaded, we're just waiting for the callback
  if (this.fontCssFamiliesAdded[family]) {
    return;
  }

  this.fontCssFamiliesAdded[family] = true;

  var newStyle = document.createElement('style');
  newStyle.type = 'text/css';

  let baseUrl = Noodl.Env["BaseUrl"] || '/';

  if (fontURL.startsWith('/')) {
    fontURL = fontURL.substring(1);
  }

  newStyle.appendChild(
    document.createTextNode("@font-face { font-family: '" + family + "'; src: url('" + baseUrl + fontURL + "'); }\n")
  );
  document.head.appendChild(newStyle);

  // Support SSR
  if (typeof window !== 'undefined') {
    var self = this;

    const WebFontLoader = require('webfontloader');
    WebFontLoader.load({
      timeout: 1000 * 600, //10 minutes in case the bandwidth is reeeeeeally low
      custom: {
        families: [family]
      },
      fontactive: function (family) {
        self.loadedFontFamilies[family] = true;
        if (self.fontCallbacks[family]) {
          self.fontCallbacks[family].forEach(function (callback) {
            callback();
          });
        }
      }
    });
  }
};

FontLoader.prototype.callWhenFontIsActive = function (family, callback) {
  if (this.loadedFontFamilies[family]) {
    callback();
    return;
  }

  if (!this.fontCallbacks[family]) {
    this.fontCallbacks[family] = [];
  }
  this.fontCallbacks[family].push(callback);
};

FontLoader.instance = new FontLoader();

module.exports = FontLoader;

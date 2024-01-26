import _ from 'underscore';

import { ProjectModel } from '@noodl-models/projectmodel';
import FileSystem from '@noodl-utils/filesystem';

import View from '../../../../../shared/view';

const ImagePickerTemplate = require('../../../templates/propertyeditor/fontpicker.html');

var FontPicker = function (args) {
  View.call(this);

  this.items = [];
  this.onItemSelected = args.onItemSelected;
};
FontPicker.prototype = Object.create(View.prototype);

FontPicker.prototype.resize = function (layout) {
  this.el.css({
    position: 'absolute',
    left: layout.x + 'px',
    top: layout.y + 'px',
    width: layout.width + 'px',
    height: layout.height + 'px'
  });
};

FontPicker.prototype.addCommonFont = function (name) {
  var el = this.bindView(this.cloneTemplate('item'), { name: name });
  el.css({ fontFamily: name });
  this.items.push({
    el: el,
    name: name,
    fullPath: name,
    folder: 'Common fonts'
  });
};

FontPicker.prototype.renderItems = function (appendTo) {
  var _this = this;

  if (!this.el) return;

  var appendTo = this.$('.fontItems');
  appendTo.html('');

  this.items.sort(function (a, b) {
    if (a.folder === '/' && b.folder !== '/') return -1;
    if (b.folder === '/' && a.folder !== '/') return 1;

    if (a.folder === 'Common fonts' && b.folder !== 'Common fonts') return 1;
    if (b.folder === 'Common fonts' && a.folder !== 'Common fonts') return -1;

    return a.fullPath < b.fullPath ? -1 : 1;
  });

  function append(item) {
    appendTo.append(item.el);
    item.el.on('click', function () {
      _this.itemClicked(item);
    });
  }

  // Render all that match filter
  var folder;
  for (var i in this.items) {
    var item = this.items[i];

    if (item.folder !== folder) {
      folder = item.folder;
      if (folder !== '/') appendTo.append('<div class="content-picker-group-label">' + folder + '</div>');
    }

    if (
      this.pathFilter === undefined ||
      this.pathFilter === '' ||
      item.fullPath.toLowerCase().indexOf(this.pathFilter) !== -1
    ) {
      append(item);
    }
  }
};

FontPicker.prototype.setFilter = function (filter) {
  this.pathFilter = filter.toLowerCase();
  this.renderItems();
};

var fontDataURLCache = {};
FontPicker.prototype.getFontDataURL = function (fileEntry, callback) {
  if (fontDataURLCache[fileEntry.name]) {
    callback(fontDataURLCache[fileEntry.name]);
    return;
  }

  FileSystem.instance.downloadAsDataURI(fileEntry.fullPath, function (content) {
    fontDataURLCache[fileEntry.name] = content;
    callback(content);
  });
};

FontPicker.prototype.render = function () {
  var _this = this;

  const el = this.bindView($(ImagePickerTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  // Render image objects
  ProjectModel.instance.listFilesInProjectDirectory(
    function (files) {
      _.each(files, function (fileEntry) {
        var filesLeft = 0;
        filesLeft++;
        function fileCompleted() {
          if (--filesLeft === 0) _this.renderItems();
        }

        _this.getFontDataURL(fileEntry, function (dataURL) {
          if (!dataURL) {
            fileCompleted();
            return;
          }

          var nameWithoutExtension = fileEntry.name.slice(0, -4);
          var pathInProjectFolder = fileEntry.fullPath.substring(
            ProjectModel.instance._retainedProjectDirectory.length + 1
          );
          var nameWithoutExtensionAndSpaces = nameWithoutExtension.replace(/\s/g, '');
          var el = _this.bindView(_this.cloneTemplate('item'), { name: nameWithoutExtension });
          _this.el.append(
            '<style>@font-face {font-family: "' +
              nameWithoutExtensionAndSpaces +
              '"; src: url(' +
              dataURL +
              ');}</style>'
          );
          el.css({ fontFamily: nameWithoutExtensionAndSpaces });

          // Extract folder for image
          var folder = pathInProjectFolder.split('/');
          if (folder.length === 1) folder = '/';
          else folder = folder.splice(0, folder.length - 1).join('/');

          _this.items.push({
            el: el,
            name: fileEntry.name,
            folder: folder,
            fullPath: pathInProjectFolder
          });
          fileCompleted();
        });
      });
    },
    ['otf', 'ttf', 'woff', 'woff2']
  );

  // Common fonts
  this.addCommonFont('Arial');
  this.addCommonFont('Helvetica');
  this.addCommonFont('Times New Roman');
  this.addCommonFont('Arial Black');
  this.addCommonFont('Impact');
  this.addCommonFont('Tahoma');
  this.addCommonFont('Courier New');
  this.addCommonFont('Lucida Console');
  this.renderItems();

  return this.el;
};

FontPicker.prototype.itemClicked = function (scope) {
  this.onItemSelected && this.onItemSelected(scope.fullPath);
};

export default FontPicker;

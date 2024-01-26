import _ from 'underscore';

import { ProjectModel } from '@noodl-models/projectmodel';

import View from '../../../../../../../shared/view';
import FilePickerTemplate from '../../../../../templates/propertyeditor/filepicker.html';

var FilePicker = function (args) {
  View.call(this);

  this.items = [];
  this.onItemSelected = args.onItemSelected;
  this.fileTypes = args.fileTypes;
};
FilePicker.prototype = Object.create(View.prototype);

FilePicker.prototype.resize = function (layout) {
  this.el.css({
    position: 'absolute',
    left: layout.x + 'px',
    top: layout.y + 'px',
    width: layout.width + 'px',
    height: layout.height + 'px'
  });
};

FilePicker.prototype.renderItems = function () {
  var _this = this;

  if (!this.el) return;

  this.$('.items').html('');

  this.items.sort(function (a, b) {
    if (a.folder === '/' && b.folder !== '/') return -1;
    if (b.folder === '/' && a.folder !== '/') return 1;
    return a.fullPath < b.fullPath ? -1 : 1;
  });

  function append(item) {
    _this.$('.items').append(item.el);
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
      if (folder !== '/') this.$('.items').append('<div class="content-picker-group-label">' + folder + '</div>');
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

FilePicker.prototype.setFilter = function (filter) {
  this.pathFilter = filter.toLowerCase();
  this.renderItems();
};

FilePicker.prototype.render = function () {
  var _this = this;

  var el = this.bindView($(FilePickerTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  // Render image objects
  ProjectModel.instance.listFilesInProjectDirectory(function (files) {
    _.each(files, function (fileEntry) {
      var pathInProjectFolder = fileEntry.fullPath.substring(
        ProjectModel.instance._retainedProjectDirectory.length + 1
      );
      var el = _this.bindView(_this.cloneTemplate('item'), { name: fileEntry.name, fullPath: pathInProjectFolder });

      // Extract folder for image
      var folder = pathInProjectFolder.split('/');
      if (folder.length === 1) folder = '/';
      else folder = folder.splice(0, folder.length - 1).join('/');

      _this.items.push({
        el: el,
        name: fileEntry.name,
        fullPath: pathInProjectFolder,
        folder: folder
      });
    });
    _this.renderItems();
  }, _this.fileTypes);

  return this.el;
};

FilePicker.prototype.itemClicked = function (scope) {
  this.onItemSelected && this.onItemSelected(scope.fullPath);
};

export default FilePicker;

import _ from 'underscore';

import { ProjectModel } from '@noodl-models/projectmodel';
import ThumbnailCache from '@noodl-utils/thumbnailcache';

import View from '../../../../../shared/view';
import ImagePickerTemplate from '../../../templates/propertyeditor/imagepicker.html';

var ImagePicker = function (args) {
  View.call(this);

  this.items = [];
  this.onItemSelected = args.onItemSelected;
};
ImagePicker.prototype = Object.create(View.prototype);

ImagePicker.prototype.resize = function (layout) {
  this.el.css({
    position: 'absolute',
    left: layout.x + 'px',
    top: layout.y + 'px',
    width: layout.width + 'px',
    height: layout.height + 'px'
  });
};

ImagePicker.prototype.renderItems = function () {
  var _this = this;

  if (!this.el) return;

  this.$('.imageItems').html('');

  this.items.sort(function (a, b) {
    if (a.folder === '/' && b.folder !== '/') return -1;
    if (b.folder === '/' && a.folder !== '/') return 1;
    return a.fullPath < b.fullPath ? -1 : 1;
  });

  function append(item) {
    _this.$('.imageItems').append(item.el);
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
      if (folder !== '/') this.$('.imageItems').append('<div class="content-picker-group-label">' + folder + '</div>');
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

ImagePicker.prototype.setFilter = function (filter) {
  this.pathFilter = filter.toLowerCase();
  this.renderItems();
};

ImagePicker.prototype.render = function () {
  var _this = this;

  var el = this.bindView($(ImagePickerTemplate), this);
  if (this.el) this.el.append(el);
  else this.el = el;

  // Render image objects
  ProjectModel.instance.listFilesInProjectDirectory(
    function (files) {
      var filesLeft = 0;
      function fileCompleted() {
        if (--filesLeft === 0) _this.renderItems();
      }

      _.each(files, function (fileEntry) {
        filesLeft++;
        ThumbnailCache.instance.getThumbnailForFile(fileEntry, function (thumbnail) {
          var pathInProjectFolder = fileEntry.fullPath.substring(
            ProjectModel.instance._retainedProjectDirectory.length + 1
          );
          var el = _this.bindView(_this.cloneTemplate('item'), {
            thumbnail: thumbnail ? thumbnail.dataUrl : undefined,
            name: fileEntry.name,
            fullPath: pathInProjectFolder
          });

          // Extract folder for image
          var folder = pathInProjectFolder.split('/');
          if (folder.length === 1) folder = '/';
          else folder = folder.splice(0, folder.length - 1).join('/');

          _this.items.push({
            el: el,
            name: fileEntry.name,
            fullPath: pathInProjectFolder,
            folder: folder,
            originalSize: thumbnail ? thumbnail.originalSize : undefined
          });
          fileCompleted();
        });
      });
    },
    ['png', 'jpeg', 'jpg', 'svg', 'gif', 'webp']
  );

  return this.el;
};

ImagePicker.prototype.itemClicked = function (scope) {
  this.onItemSelected && this.onItemSelected(scope.fullPath);
};

export default ImagePicker;

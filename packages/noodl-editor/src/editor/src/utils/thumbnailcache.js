var FileSystem = require('./filesystem');

var ThumbnailCache = function () {
  this.thumbnails = {};
  this.thumbnailSize = { width: 50, height: 50 };
};

ThumbnailCache.prototype.getThumbnailForFile = function (fileEntry, callback) {
  var _this = this;

  FileSystem.instance.getFileMetadata(
    fileEntry.fullPath,
    function (metadata) {
      if (
        _this.thumbnails[fileEntry.fullPath] === undefined ||
        +_this.thumbnails[fileEntry.fullPath].modified !== +new Date(metadata.modificationTime)
      ) {
        _this.createThumbnailForFile(fileEntry, metadata, callback);
      } else {
        callback(_this.thumbnails[fileEntry.fullPath]);
      }
    },
    function () {
      // Error loading metadata
      callback && callback();
    }
  );
};

/*ThumbnailCache.prototype.getThumbnailCanvas = function() {
  var el = $('#tnumbnailCacheCanvas');
  if(el.length === 0) {
    $('body').append('<canvas id="tnumbnailCacheCanvas"></canvas>');
    el = $('#tnumbnailCacheCanvas');
  }

  return el;
}*/

ThumbnailCache.prototype.createThumbnailForFile = function (fileEntry, metadata, callback) {
  var _this = this;

  FileSystem.instance.downloadAsDataURI(fileEntry.fullPath, function (content) {
    var img = new Image();
    img.onload = function () {
      var canvas1 = document.createElement('canvas');
      var canvas2 = document.createElement('canvas');
      var target = canvas1;
      var source = img;

      // Halve the image in size until we can do a final scale
      // otherwise the scaling quality is too poor
      while (true) {
        var newWidth = Math.round(source.width * 0.5);
        var newHeight = Math.round(source.height * 0.5);
        if (newWidth <= _this.thumbnailSize.width || newHeight <= _this.thumbnailSize.height) {
          if (source.width > source.height) {
            newHeight = _this.thumbnailSize.height;
            newWidth = (source.width / source.height) * newHeight;
          } else {
            newWidth = _this.thumbnailSize.width;
            newHeight = (source.height / source.width) * newWidth;
          }
          target.width = _this.thumbnailSize.width;
          target.height = _this.thumbnailSize.height;
          var ctx = target.getContext('2d');
          ctx.clearRect(0, 0, target.width, target.height);
          ctx.drawImage(
            source,
            (_this.thumbnailSize.width - newWidth) / 2,
            (_this.thumbnailSize.height - newHeight) / 2,
            newWidth,
            newHeight
          );
          try {
            _this.thumbnails[fileEntry.fullPath] = {
              dataUrl: target.toDataURL(),
              modified: new Date(metadata.modificationTime)
            };
            callback && callback(_this.thumbnails[fileEntry.fullPath]);
          } catch (e) {
            console.log('Error creating thumbnail for', fileEntry.fullPath, e.message);
            callback && callback();
          }
          return;
        } else {
          target.width = newWidth;
          target.height = newHeight;
          var ctx = target.getContext('2d');
          ctx.clearRect(0, 0, target.width, target.height);
          ctx.drawImage(source, 0, 0, target.width, target.height);
        }

        // swap
        target = target === canvas1 ? canvas2 : canvas1;
        source = target == canvas1 ? canvas2 : canvas1;
      }
    };
    img.onerror = function () {
      callback && callback();
    };
    img.src = content;
  });
};

ThumbnailCache.instance = new ThumbnailCache();

module.exports = ThumbnailCache;

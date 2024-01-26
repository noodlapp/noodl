var PersistentFileSystem = new (function () {})();

// Initialize the filesystem
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(
  window.PERSISTENT,
  200 * 1024 * 1024,
  function (filesystem) {
    if (filesystem) PersistentFileSystem.instance = filesystem.root;
  },
  function () {
    // Error
  }
);

module.exports = PersistentFileSystem;

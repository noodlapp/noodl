const { ProjectModel } = require('../models/projectmodel');
const FileSystem = require('./filesystem');

class FontLoader {
  constructor() {
    this.loadedFonts = new Set();
  }

  loadFont(familyName, fontPath) {
    if (this.loadedFonts.has(fontPath)) {
      return;
    }

    this.loadedFonts.add(fontPath);

    const fullPath = ProjectModel.instance._retainedProjectDirectory + '/' + fontPath;
    FileSystem.instance.downloadAsDataURI(fullPath, (dataURL) => {
      $(document.head).append(
        '<style>@font-face {font-family: "' + familyName + '"; src: url(' + dataURL + ');}</style>'
      );
    });
  }
}

FontLoader.instance = new FontLoader();

module.exports = FontLoader;

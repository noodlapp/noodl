class CloudFile {
  constructor({ name, url }) {
    this.name = name;
    this.url = url;
  }

  getUrl() {
    return this.url;
  }

  getName() {
    return this.name;
  }

  toString() {
    return this.url;
  }
}

module.exports = CloudFile;

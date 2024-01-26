const CloudFile = require('../../../api/cloudfile');

const CloudFileNode = {
  name: 'Cloud File',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/cloud-file',
  category: 'Cloud Services',
  color: 'data',
  getInspectInfo() {
    return this._internal.cloudFile && this._internal.cloudFile.getUrl();
  },
  outputs: {
    url: {
      type: 'string',
      displayName: 'URL',
      group: 'General',
      get() {
        return this._internal.cloudFile && this._internal.cloudFile.getUrl();
      }
    },
    name: {
      type: 'string',
      displayName: 'Name',
      group: 'General',
      get() {
        if (!this._internal.cloudFile) return;

        //parse prefixes the file with a guid_
        //remove it so the name is the same as the original file name
        const n = this._internal.cloudFile.getName().split('_');
        return n.length === 1 ? n[0] : n.slice(1).join('_');
      }
    }
  },
  inputs: {
    file: {
      type: 'cloudfile',
      displayName: 'Cloud File',
      group: 'General',
      set(value) {
        if (value instanceof CloudFile === false) {
          return;
        }
        this._internal.cloudFile = value;
        this.flagOutputDirty('name');
        this.flagOutputDirty('url');
      }
    }
  }
};

module.exports = {
  node: CloudFileNode
};

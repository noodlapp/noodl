'use strict';

const CloudFile = require('@noodl/runtime/src/api/cloudfile');
const CloudStore = require('@noodl/runtime/src/api/cloudstore');

const UploadFile = {
  name: 'Upload File',
  docs: 'https://docs.noodl.net/nodes/data/cloud-data/upload-file',
  category: 'Cloud Services',
  color: 'data',
  getInspectInfo() {
    return this._internal.response;
  },
  inputs: {
    file: {
      group: 'General',
      displayName: 'File',
      type: '*',
      set(file) {
        this._internal.file = file;
      }
    },
    upload: {
      type: 'signal',
      displayName: 'Upload',
      group: 'Actions',
      valueChangedToTrue() {
        this.scheduleAfterInputsHaveUpdated(() => {
          const file = this._internal.file;

          if (!file) {
            this.setError('No file specified');
            return;
          }

          CloudStore.instance.uploadFile({
            file,
            onUploadProgress: (p) => {
              this._internal.progressTotal = p.total;
              this._internal.progressLoaded = p.loaded;

              this.flagOutputDirty('progressTotalBytes');
              this.flagOutputDirty('progressLoadedBytes');
              this.flagOutputDirty('progressLoadedPercent');
              this.sendSignalOnOutput('progressChanged');
            },
            success: (response) => {
              this._internal.cloudFile = new CloudFile(response);
              this.flagOutputDirty('cloudFile');
              this.sendSignalOnOutput('success');
            },
            error: (e) => this.setError(e)
          });
        });
      }
    }
  },
  outputs: {
    cloudFile: {
      group: 'General',
      displayName: 'Cloud File',
      type: 'cloudfile',
      get() {
        return this._internal.cloudFile;
      }
    },
    success: {
      group: 'Events',
      displayName: 'Success',
      type: 'signal'
    },
    failure: {
      group: 'Events',
      displayName: 'Failure',
      type: 'signal'
    },
    error: {
      type: 'string',
      displayName: 'Error',
      group: 'Error',
      get() {
        return this._internal.error;
      }
    },
    errorStatus: {
      type: 'number',
      displayName: 'Error Status Code',
      group: 'Error',
      get() {
        return this._internal.errorStatus;
      }
    },
    progressChanged: {
      type: 'signal',
      displayName: 'Progress Changed',
      group: 'Events'
    },
    progressTotalBytes: {
      type: 'number',
      displayName: 'Total Bytes',
      group: 'Progress',
      get() {
        return this._internal.progressTotal;
      }
    },
    progressLoadedBytes: {
      type: 'number',
      displayName: 'Uploaded Bytes',
      group: 'Progress',
      get() {
        return this._internal.progressLoaded;
      }
    },
    progressLoadedPercent: {
      type: 'number',
      displayName: 'Uploaded Percent',
      group: 'Progress',
      get() {
        if (!this._internal.progressTotal) return 0;
        return (this._internal.progressLoaded / this._internal.progressTotal) * 100;
      }
    }
  },
  methods: {
    setError(err) {
      this._internal.error = err.hasOwnProperty('error') ? err.error : err;
      //use the error code. If there is none, use the http status
      this._internal.errorStatus = err.code || err.status || 0;
      this.flagOutputDirty('error');
      this.flagOutputDirty('errorStatus');
      this.sendSignalOnOutput('failure');
    }
  }
};

module.exports = {
  node: UploadFile
};

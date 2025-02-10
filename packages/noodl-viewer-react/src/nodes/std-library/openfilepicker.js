'use strict';

const OpenFilePicker = {
  name: 'Open File Picker',
  docs: 'https://docs.noodl.net/nodes/utilities/open-file-picker',
  category: 'Utilities',
  getInspectInfo() {
    if (this._internal.file) {
      return this._internal.file.path;
    }
  },
  initialize() {
    //for some reason the input element has to be created here, it doesn't
    //work predictably in Safari when created in the open signal function.
    //Creating it here and reusing it seems to work correctly in all browsers.
    const input = document.createElement('input');
    input.type = 'file';

    this._internal.inputElement = input;
  },
  inputs: {
    open: {
      type: 'signal',
      displayName: 'Open',
      group: 'Actions',
      valueChangedToTrue() {
        const input = this._internal.inputElement;

        const onChange = (e) => {
          this._internal.file = e.target.files[0];

          this.flagOutputDirty('file');
          this.flagOutputDirty('path');
          this.flagOutputDirty('name');
          this.flagOutputDirty('sizeInBytes');
          this.flagOutputDirty('type');

          this.sendSignalOnOutput('success');

          input.onchange = null;
          input.value = ''; //reset value so the same file can be picked again
        };

        input.accept = this._internal.acceptedFileTypes;

        if (this._internal.capture) {
          input.capture = this._internal.capture;
        }

        input.onchange = onChange;
        input.click();
      }
    },
    acceptedFileTypes: {
      group: 'General',
      type: 'string',
      displayName: 'Accepted file types',
      set(value) {
        this._internal.acceptedFileTypes = value;
      }
    },
    capture: {
      group: 'General',
      type: 'string',
      displayName: 'Capture',
      set(value) {
        this._internal.capture = value;
      }
    }
  },
  outputs: {
    file: {
      type: '*',
      displayName: 'File',
      group: 'General',
      get() {
        return this._internal.file;
      }
    },
    path: {
      displayName: 'Path',
      group: 'Metadata',
      type: 'string',
      get() {
        return this._internal.file && this._internal.file.path;
      }
    },
    name: {
      displayName: 'Name',
      group: 'Metadata',
      type: 'string',
      get() {
        return this._internal.file && this._internal.file.name;
      }
    },
    sizeInBytes: {
      displayName: 'Size in bytes',
      group: 'Metadata',
      type: 'number',
      get() {
        return this._internal.file && this._internal.file.size;
      }
    },
    type: {
      displayName: 'Type',
      group: 'Metadata',
      type: 'string',
      get() {
        return this._internal.file && this._internal.file.type;
      }
    },
    success: {
      type: 'signal',
      group: 'Events',
      displayName: 'Success'
    }
  }
};

module.exports = {
  node: OpenFilePicker
};

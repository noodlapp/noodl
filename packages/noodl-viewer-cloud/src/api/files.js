const CloudStore = require('@noodl/runtime/src/api/cloudstore');

const files = {
  async delete(fileName) {
    return new Promise((resolve, reject) => {
      CloudStore.instance.deleteFile({
        file: { name: fileName },
        success: (response) => {
          resolve();
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }
};

module.exports = files;

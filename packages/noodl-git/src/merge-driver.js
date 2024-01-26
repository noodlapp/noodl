const fs = require('fs');

const isRenderer = process && process.type === 'renderer';

// TODO: Remove electron
const app = isRenderer ? require('@electron/remote').app : require('electron').app;
const tmpFolder = app.getPath('temp');

const driverOptionsPath = tmpFolder + 'noodl-merge-driver-options.json';

/**
 *
 * @param {{ reversed: boolean; }} options
 * @returns
 */

module.exports = {
  /**
   * @param {{
   *    reversed: boolean;
   * }} options
   * @returns
   */
  writeMergeDriverOptions(options) {
    if (typeof options !== 'object') throw new Error('options is not an object');
    return fs.promises.writeFile(driverOptionsPath, JSON.stringify(options));
  },

  cleanMergeDriverOptionsSync() {
    if (fs.existsSync(driverOptionsPath)) {
      fs.unlinkSync(driverOptionsPath);
    }
  },

  /**
   *
   * @returns {{
   *    reversed: boolean;
   * }}
   */
  readMergeDriverOptionsSync() {
    try {
      if (fs.existsSync(driverOptionsPath)) {
        const options = fs.readFileSync(driverOptionsPath);
        return JSON.parse(options);
      }
    } catch (error) {
      console.error(error);
    }

    return {};
  }
};

const fs = require('fs');
const path = require('path');
var electron_notarize = require('electron-notarize');

module.exports = async function (params) {
  if (process.platform !== 'darwin') {
    return;
  }

  if (!process.env.appleIdPassword) {
    console.log('apple password not set, skipping notarization');
    return;
  }

  const appId = 'noodl.net.noodl';

  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    await electron_notarize.notarize({
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.appleId,
      appleIdPassword: process.env.appleIdPassword
    });
  } catch (error) {
    console.error(error);
  }

  console.log(`Done notarizing ${appId}`);
};

const fs = require('fs');
const path = require('path');

module.exports = async function (params) {
  if (process.platform !== 'darwin') {
    return;
  }

  if (!process.env.appleIdPassword) {
    console.log('apple password not set, skipping notarization');
    return;
  }

  const appId = 'fluxscape.net.fluxscape';

  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    const electron_notarize = require('electron-notarize');
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

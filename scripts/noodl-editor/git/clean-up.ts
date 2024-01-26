import { unlinkSync } from 'fs-extra';
import path from 'path';

export function gitCleanUp(options: { gitDir: string; architecture: string }) {
  if (process.platform === 'win32') {
    console.log('Noodl Build: Cleaning unneeded Git components…');
    const files = [
      'Bitbucket.Authentication.dll',
      'GitHub.Authentication.exe',
      'Microsoft.Alm.Authentication.dll',
      'Microsoft.Alm.Git.dll',
      'Microsoft.IdentityModel.Clients.ActiveDirectory.Platform.dll',
      'Microsoft.IdentityModel.Clients.ActiveDirectory.dll',
      'Microsoft.Vsts.Authentication.dll',
      'git-askpass.exe',
      'git-credential-manager.exe',
      'WebView2Loader.dll'
    ];

    const mingwFolder = options.architecture === 'x64' ? 'mingw64' : 'mingw32';
    const gitCoreDir = path.join(options.gitDir, mingwFolder, 'libexec', 'git-core');

    for (const file of files) {
      const filePath = path.join(gitCoreDir, file);
      try {
        unlinkSync(filePath);
      } catch (err) {
        // probably already cleaned up
      }
    }
  }
}

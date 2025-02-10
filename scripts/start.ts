import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

import { ConsoleColor, attachStdio } from './utils/process';

const CWD = path.join(__dirname, '..');
const LOCAL_GIT_DIRECTORY = path.join(__dirname, '..', 'node_modules', 'dugite', 'git');
const LOCAL_GIT_TRAMPOLINE_DIRECTORY = path.join(
  __dirname,
  '..',
  'node_modules',
  'desktop-trampoline/build/Release/desktop-trampoline'
);

// Print variables for easy debugging
console.log('---');
console.log(`> CWD: `, CWD);
console.log(`> LOCAL_GIT_DIRECTORY: `, LOCAL_GIT_DIRECTORY);
console.log(`> LOCAL_GIT_TRAMPOLINE_DIRECTORY: `, LOCAL_GIT_TRAMPOLINE_DIRECTORY);
console.log('---');

// Verify git path
switch (process.platform) {
  case 'win32': {
    const gitExist = fs.existsSync(path.join(LOCAL_GIT_DIRECTORY, 'mingw64/bin', 'git.exe'));
    if (gitExist) {
      console.log('> Found git.exe');
    } else {
      throw new Error("'git.exe' is missing, this can be caused by node_modules issues.");
    }
    break;
  }

  case 'darwin': {
    const gitExist = fs.existsSync(path.join(LOCAL_GIT_DIRECTORY, 'bin', 'git'));
    if (gitExist) {
      console.log('> Found git executable');
    } else {
      throw new Error("'git' is missing, this can be caused by node_modules issues.");
    }
    break;
  }
}

console.log('---');

// Start processes
const processOptions = {
  cwd: CWD,
  env: {
    ...process.env,
    LOCAL_GIT_DIRECTORY,
    LOCAL_GIT_TRAMPOLINE_DIRECTORY
  }
};

const argBuildViewers = process.argv.includes('--build-viewer');
const viewerScript = argBuildViewers ? 'build' : 'start';

const viewerProcess = attachStdio(
  exec(`npx lerna exec --scope @noodl/noodl-viewer-react -- npm run ${viewerScript}`, processOptions),
  {
    prefix: 'Viewer',
    color: ConsoleColor.FgMagenta
  }
);

const cloudRuntimeProcess = attachStdio(
  exec(`npx lerna exec --scope @noodl/cloud-runtime -- npm run ${viewerScript}`, processOptions),
  {
    prefix: 'Cloud',
    color: ConsoleColor.FgMagenta
  }
);

const editorProcess = attachStdio(exec('npx lerna exec --scope fluxscape-editor -- npm run start', processOptions), {
  prefix: 'Editor',
  color: ConsoleColor.FgCyan
});

editorProcess.on('exit', (code) => {
  if (typeof code === 'number') {
    viewerProcess.kill(0);
    cloudRuntimeProcess.kill(0);
    process.exit(0);
  }
});

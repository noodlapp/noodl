/// ---------------------------------------------------------------------------
/// This file is designed to be small, and reflect how GitHub Actions is setup.
/// ---------------------------------------------------------------------------

import { execSync } from 'child_process';
import { argv } from 'node:process';
import path from 'path';
import rimraf from 'rimraf';

import { getCurrentPlatform } from './helper';

// Inputs
const [_nodeExecPath, _executedFilePath, ...args] = argv;
const SKIP_GIT_CHECK = args.includes('--skip-git');

const WORKSPACE_PATH = path.resolve(__dirname, '..');
const TARGET_PLATFORM = process.env.TARGET_PLATFORM || getCurrentPlatform();
const DISABLE_SIGNING = process.env.DISABLE_SIGNING;
const CSC_NAME = process.env.CSC_NAME;

// Debug Configuration
console.log('--- Configuration');
console.log('> WORKSPACE_PATH: ', WORKSPACE_PATH);
console.log('> TARGET_PLATFORM: ', TARGET_PLATFORM);
console.log('---');

console.log('--- Verify git status');
if (SKIP_GIT_CHECK) {
  console.log('* --- SKIP GIT CHECK (--skip-git)');
} else {
  try {
    const gitDiff = execSync('git diff --numstat', {
      env: process.env
    }).toString();

    if (gitDiff !== '') {
      console.log();
      console.log('--- You have local git changes, please commit them before building.');
      console.log();
      throw new Error();
    }
  } catch (error) {
    console.error('git diff failed.');
    throw error;
  }
}

// Start clean!
console.log('---> clean');
execSync('npx lerna clean --yes', {
  stdio: 'inherit',
  env: process.env
});

// Delete dist folders
console.log("--- delete 'dist' folders");
rimraf.sync('./dist');
rimraf.sync('./packages/noodl-editor/dist');

// Build Viewer
console.log('---> build viewer');
execSync('npm run build:editor:_viewer', {
  stdio: 'inherit',
  env: {
    ...process.env,
    WORKSPACE_PATH
  }
});

try {
  // Build Editor
  console.log('---> build editor');
  execSync('npm run build:editor:_editor', {
    stdio: 'inherit',
    env: {
      ...process.env,
      WORKSPACE_PATH,
      DISABLE_SIGNING,
      CSC_NAME,
    }
  });
} catch (error) {
  console.error(error);
  // I would like it to continue and collect the other information,
  // it could be useful for debugging.

  if (process.platform === 'darwin') {
    // NOTE: /node_modules/app-builder-lib/templates/entitlements.mac.plist is missing
    execSync(`ls ./node_modules/app-builder-lib/templates`, {
      stdio: 'inherit',
      env: process.env
    });
  }
}

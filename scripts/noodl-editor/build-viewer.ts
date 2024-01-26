import { execSync } from 'child_process';
import path from 'path';

// HACK :)
import { FileSystemNode } from '../../packages/noodl-platform-node/src/filesystem-node';

async function buildViewer({ name, relativePath }) {
  // Inputs
  const WORKSPACE_PATH = path.resolve(__dirname, '../..');

  // Variables
  const noodlViewerPath = path.join(WORKSPACE_PATH, 'packages/' + relativePath);
  const noodlEditorPath = path.join(WORKSPACE_PATH, 'packages', 'noodl-editor');
  const destination = path.join(noodlEditorPath, 'src', 'external');

  // Debug Configuration
  console.log('--- Configuration');
  console.log('> WORKSPACE_PATH: ', WORKSPACE_PATH);
  console.log('---');
  console.log('> noodlViewerPath: ', noodlViewerPath);
  console.log('> noodlEditorPath: ', noodlEditorPath);
  console.log('> destination: ', destination);
  console.log('---');

  // Install dependencies
  console.log("--- Run 'npm install' (cwd: ", noodlViewerPath, ') ...');
  execSync('npm i', {
    cwd: noodlViewerPath,
    stdio: 'inherit',
    env: {
      ...process.env
    }
  });
  console.log("--- 'npm install' done!");

  // Build
  console.log("--- Run 'npm run build' (cwd: ", noodlViewerPath, ') ...');
  execSync(`npx lerna exec --scope ${name} -- npm run build`, {
    cwd: WORKSPACE_PATH,
    stdio: 'inherit',
    env: {
      ...process.env,
      OUTPUT_PATH: destination
    }
  });
  console.log("--- 'npm run build' done!");

  // Display result
  const filesystem = new FileSystemNode();
  const files = await filesystem.listDirectoryFiles(destination);
  console.log('--- List build files:');
  files.forEach((file, index) => {
    console.log(index, file.fullPath);
  });

  // Clean up
  console.log('--- Clean up ...');
  execSync(`npx lerna clean --yes --scope ${name}`, {
    stdio: 'inherit',
    env: {
      ...process.env
    }
  });
  console.log('--- Clean up done!');
}

(async function () {
  await buildViewer({
    relativePath: 'noodl-viewer-react',
    name: '@noodl/noodl-viewer-react'
  });

  await buildViewer({
    relativePath: 'noodl-viewer-cloud',
    name: '@noodl/cloud-runtime'
  });
})();

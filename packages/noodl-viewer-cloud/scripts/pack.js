const fs = require('fs');
const path = require('path');

const publishDir = path.join(__dirname, '../publish');
const publishDistDir = path.join(__dirname, '../publish/dist/');

// Delete the publish folder if it exists
if (fs.existsSync(publishDir)) {
  fs.rmdirSync(publishDir, { recursive: true, force: true });
}

// Create the publish folders
fs.mkdirSync(publishDistDir, { recursive: true });

// Copy over the wanted files
const files = ['dist/main.js', 'package.json', 'README.md', 'LICENSE'];

files.forEach((file) => {
  const fromPath = path.join(__dirname, '..', file);
  const toPath = path.join(publishDir, file);
  fs.copyFileSync(fromPath, toPath);
});

// Clean up package.json
const packageFilePath = path.join(publishDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageFilePath));

delete packageJson.scripts;
delete packageJson.dependencies;
delete packageJson.devDependencies;

fs.writeFileSync(packageFilePath, JSON.stringify(packageJson, null, 2));

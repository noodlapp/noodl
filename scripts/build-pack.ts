import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

async function copyFilesMatchingRegex(
  sourceFolder: string,
  destinationFolder: string,
  regexList: RegExp[]
): Promise<void> {
  try {
    // Ensure the destination folder exists
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }

    // Read the files in the source folder
    const files = await readdir(sourceFolder);

    // Iterate through each file
    for (const file of files) {
      const filePath = path.join(sourceFolder, file);

      // Check if it is a file
      const stats = await stat(filePath);
      if (stats.isFile()) {
        // Check if the file matches any regex in the list
        if (regexList.some((regex) => regex.test(file))) {
          // Copy the file to the destination folder
          const destinationPath = path.join(destinationFolder, file);
          await copyFile(filePath, destinationPath);
          console.log(`Copied: ${file}`);
        }
      }
    }

    console.log('Copy operation completed.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const sourceFolder = path.join(__dirname, '..', 'packages/noodl-editor/dist');
const destinationFolder = path.join(__dirname, '..', 'publish');
const regexList: RegExp[] = [
  /* Windows */
  /.*Setup.*\.exe$/,
  /.*Setup.*\.blockmap$/,

  /* MacOS */
  /.*\.dmg$/,
  /.*\.blockmap$/
];

fs.mkdirSync(destinationFolder, { recursive: true });

copyFilesMatchingRegex(sourceFolder, destinationFolder, regexList);

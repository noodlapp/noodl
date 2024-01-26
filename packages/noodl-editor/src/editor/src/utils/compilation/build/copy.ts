import { filesystem, FileInfo } from '@noodl/platform';

import { clearFolders } from './cleanup';

export async function copyProjectFilesToFolder(projectPath: string, direntry: string): Promise<void> {
  // TODO: Load something like .noodlignore file list
  const ignoreFiles = ['.DS_Store', '.gitignore', '.gitattributes', 'project.json', 'Dockerfile'];

  // Copy everything from the project folder
  if (!projectPath) {
    throw new Error('Couldnt open project folder.');
  }

  await filesystem.makeDirectory(direntry);

  let files = await filesystem.listDirectoryFiles(projectPath);
  files = files.filter((f) => {
    if (ignoreFiles.indexOf(f.name) !== -1) return false;
    // TODO: Make this easier to access
    if (f.fullPath.indexOf('.git') !== -1) return false; // Ignore git files
    if (f.fullPath.indexOf('.noodl') !== -1) return false; // Ignore noodl files

    return true;
  });

  // First clear all folders, will be recreated later
  await clearFolders({
    projectPath,
    outputPath: direntry,
    files
  });

  let filesLeftToCopy = 0;
  let totalSuccess = true;
  function fileCompleted(success: boolean) {
    filesLeftToCopy--;
    totalSuccess = totalSuccess && success;
  }

  async function makeDirectoryAndCopyFile(f: FileInfo) {
    // TODO: This requires that the project path is looking nice
    // Example:
    // C:\\Users\\Eric\\AppData\\Roaming\\Noodl\\projects\\9acdd495-3d92-4490-ae0a-44f17bf47dca
    // C:\Users\Eric\AppData\Roaming\Noodl\projects\9acdd495-3d92-4490-ae0a-44f17bf47dca\noodl_modules\
    //                                                                       it will cut here ^
    const folderPath = f.fullPath.substring(projectPath.length, f.fullPath.length - f.name.length - 1);
    const localPath = f.fullPath.substring(projectPath.length);
    filesLeftToCopy++;

    const targetDir = filesystem.join(direntry, folderPath);
    await filesystem.makeDirectory(targetDir);

    try {
      await filesystem.copyFile(f.fullPath, direntry + '/' + localPath);
      fileCompleted(true);
    } catch (error) {
      console.error(error);
      fileCompleted(false);
    }
  }

  const tasks = files.map(makeDirectoryAndCopyFile);

  await Promise.all(tasks);

  if (!totalSuccess) {
    throw new Error('Failed to copy project files.');
  }
}

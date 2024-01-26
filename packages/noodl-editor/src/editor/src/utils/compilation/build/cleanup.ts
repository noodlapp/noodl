import { filesystem, FileInfo } from '@noodl/platform';

export interface ClearFoldersOptions {
  /** The project directory path. */
  projectPath: string;
  /** The output directory path, where we will deploy our new files. */
  outputPath: string;

  files: FileInfo[];
}

export async function clearFolders({ projectPath, outputPath, files }: ClearFoldersOptions): Promise<void> {
  const topLevelFolders: string[] = [];

  // Collect toplevel folders
  for (const i in files) {
    const file = files[i];

    const localPath = file.fullPath.substring(projectPath.length + 1);
    // File is in a subfolder of the project directory, delete it
    // but make sure to never delete .git
    if (localPath.indexOf('/') !== -1 && localPath.substring(0, 4) !== '.git') {
      const comps = localPath.split('/');
      const topFolderName = comps[0];

      if (topLevelFolders.indexOf(topFolderName) === -1) {
        topLevelFolders.push(topFolderName);
      }
    }
  }

  // No folders to clear
  if (topLevelFolders.length === 0) {
    return;
  }

  let foldersToClear = topLevelFolders.length;
  for (const i in topLevelFolders) {
    const t = topLevelFolders[i];

    await filesystem.removeDirRecursive(outputPath + '/' + t);
    foldersToClear--;
    if (foldersToClear === 0) return;
  }
}

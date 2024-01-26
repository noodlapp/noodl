export type FileBlob = Buffer | string;

export interface FileInfo {
  fullPath: string;
  name: string;
  isDirectory: boolean;
}

export interface FileStat {
  size: number;
}

export type OpenDialogOptions = {
  allowCreateDirectory?: boolean;
};

/**
 * File System that is designed to be cross platform.
 */
export interface IFileSystem {
  resolve(...paths: string[]): string;
  join(...paths: string[]): string;
  exists(path: string): boolean;
  dirname(path: string): string;
  basename(path: string): string;

  file(path: string): FileStat;

  writeFile(path: string, blob: FileBlob): Promise<void>;
  writeFileOverride(path: string, blob: FileBlob): Promise<void>;
  readFile(path: string): Promise<string>;
  readBinaryFile(path: string): Promise<Buffer>;
  removeFile(path: string): Promise<void>;
  renameFile(oldPath: string, newPath: string): Promise<void>;

  copyFile(from: string, to: string): Promise<void>;
  copyFolder(from: string, to: string): Promise<void>;

  readJson<T = any>(path: string): Promise<T>;
  writeJson(path: string, obj: any): Promise<void>;

  isDirectoryEmpty(path: string): Promise<boolean>;
  listDirectory(path: string): Promise<FileInfo[]>;
  /** List all the files in this folder recursively */
  listDirectoryFiles(path: string): Promise<FileInfo[]>;
  makeDirectory(path: string): Promise<void>;
  removeDirRecursive(path: string): void;

  openDialog(args: OpenDialogOptions): Promise<string>;

  unzipUrl(url: string, to: string): Promise<void>;
  makeUniquePath(path: string): string;
}

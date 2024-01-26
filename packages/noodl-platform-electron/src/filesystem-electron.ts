import { dialog } from '@electron/remote';
import { OpenDialogOptions as EOpenDialogOptions } from 'electron';
import { OpenDialogOptions } from '@noodl/platform';
import { FileSystemNode } from '@noodl/platform-node/src/filesystem-node';

export class FileSystemElectron extends FileSystemNode {
  openDialog(args: OpenDialogOptions): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const properties: EOpenDialogOptions['properties'] = ['openDirectory'];
      if (args?.allowCreateDirectory) {
        properties.push('createDirectory');
      }

      dialog.showOpenDialog({ properties }).then((res) => {
        if (res.canceled) {
          reject();
        } else {
          resolve(res.filePaths[0]);
        }
      });
    });
  }
}

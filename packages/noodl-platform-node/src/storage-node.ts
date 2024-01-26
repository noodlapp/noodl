import { platform, filesystem, IStorage } from "@noodl/platform";

import path from "path";
import mkdir from "mkdirp-sync";
import rimraf from "rimraf";

function fileNameForKey(key: string) {
  const keyFileName = path.basename(key, ".json") + ".json";

  // Prevent ENOENT and other similar errors when using
  // reserved characters in Windows filenames.
  // See: https://en.wikipedia.org/wiki/Filename#Reserved%5Fcharacters%5Fand%5Fwords
  const escapedFileName = encodeURIComponent(keyFileName);

  const userDataPath = platform.getUserDataPath();
  return path.join(userDataPath, escapedFileName);
}

export class StorageNode implements IStorage {
  async get(key: string): Promise<any> {
    try {
      const filename = fileNameForKey(key);
      const fileContent = await filesystem.readJson(filename);
      return fileContent;
    } catch (error) {
      // In some cases there is no json file
      // so we just return an empty object.
      return {};
    }
  }

  async set(key: string, data: { [key: string]: any }): Promise<void> {
    const filename = fileNameForKey(key);
    mkdir(path.dirname(filename));
    await filesystem.writeJson(filename, data);
  }

  async remove(key: string): Promise<void> {
    var filename = fileNameForKey(key);
    return new Promise<void>((resolve, reject) => {
      rimraf(filename, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

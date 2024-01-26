import { setFileSystem, setPlatform, setStorage } from '@noodl/platform';
import { StorageNode } from '@noodl/platform-node/src/storage-node';

import { FileSystemElectron } from './filesystem-electron';
import { PlatformElectron } from './platform-electron';

setPlatform(new PlatformElectron());
setFileSystem(new FileSystemElectron());
setStorage(new StorageNode());

import { platform, filesystem } from '@noodl/platform';

import { ProjectModel } from '@noodl-models/projectmodel';
import { createHash } from '@noodl-utils/exporter/hash/xxhash64';

import { HtmlProcessor } from './processors/html-processor';

type DeployIndexItem = {
  url: string;
  injectHTML?: boolean;
  injectExport?: boolean;
};

type DeployIndex = ReadonlyArray<DeployIndexItem>;

/**
 * Gives the path to the "external" folder.
 * @returns
 */
export function getExternalFolderPath() {
  return filesystem.join(platform.getAppPath(), 'src/external');
}

/**
 * Loads the deploy index file.
 *
 * This file includes information about which files are requried in the deploy.
 *
 * @param filePath
 * @returns
 */
export function loadDeployIndex(filePath: string): Promise<DeployIndex> {
  const indexPath = filesystem.join(getExternalFolderPath(), filePath);
  return filesystem.readJson(indexPath);
  // reject({ result: 'failure', message: 'Error exporting deploy files.' });
}

function addSuffix(url: string, suffix: string) {
  const parts = url.split('.');
  parts[parts.length - 2] = parts[parts.length - 2] + suffix;
  return parts.join('.');
}

type WriteFileToFolderArgs = {
  project: ProjectModel;
  direntry: string;
  url: string;
  exportJson?: any;
  injectHTML?: boolean;
  indexJsPath?: string;
  baseUrl?: string;
  enableHash?: boolean;
  envVariables?: Record<string, string>;
  runtimeType: string;
};

async function _writeFileToFolder({
  project,
  direntry,
  url,
  exportJson,
  injectHTML,
  indexJsPath,
  baseUrl,
  enableHash = true,
  envVariables,
  runtimeType
}: WriteFileToFolderArgs) {
  const fullPath = filesystem.join(getExternalFolderPath(), runtimeType, url);

  if (!filesystem.exists(fullPath)) {
    // TODO: Save this warning somewhere, usually, this is not an issue though.
    // This occurred because building in dev mode does not create the source map
    // files which it expects to copy over.
    return;
  }

  let content = await filesystem.readFile(fullPath);
  let filename = url;

  // Apply export if needed
  if (exportJson) {
    content = content.replace(/{{#export#}}/g, JSON.stringify(exportJson));

    if (enableHash) {
      const hash = createHash();
      hash.update(content, 'utf8');
      const hex = hash.digest('hex');

      filename = addSuffix(url, '-' + hex);
    }
  } else if (injectHTML) {
    const htmlProcessor = new HtmlProcessor(project);
    content = await htmlProcessor.process(content, {
      indexJsPath,
      baseUrl,
      envVariables
    });
  }

  await filesystem.writeFileOverride(direntry + '/' + filename, content);
  return filename;
}

type WriteIndexFilesArgs = {
  project;
  direntry;
  exportJson;
  indexJsFile: DeployIndexItem;
  indexHtmlFile: DeployIndexItem;
  baseUrl: string;
  enableHash?: boolean;
  runtimeType: string;
  envVariables?: Record<string, string>;
};

async function writeIndexFiles({
  project,
  direntry,
  exportJson,
  indexJsFile,
  indexHtmlFile,
  baseUrl,
  enableHash,
  envVariables,
  runtimeType
}: WriteIndexFilesArgs) {
  //write index.js file, with a hashed name
  const indexJsPath = await _writeFileToFolder({
    project,
    direntry,
    url: indexJsFile.url,
    exportJson,
    enableHash,
    runtimeType
  });

  if (indexHtmlFile) {
    //and write the index.html file with the correct path
    await _writeFileToFolder({
      project,
      direntry,
      url: indexHtmlFile.url,
      exportJson: undefined,
      injectHTML: true,
      indexJsPath,
      baseUrl,
      enableHash,
      runtimeType
    });
  }
}

export type CopyDeployFilesToFolderArgs = {
  project: ProjectModel;
  direntry: string;
  files: DeployIndex;
  exportJson: unknown; // big json object
  baseUrl: string;
  /** Example "deploy" folder */
  runtimeType: string;
  envVariables?: Record<string, string>;
};

export async function copyDeployFilesToFolder({
  project,
  direntry,
  files,
  exportJson,
  baseUrl,
  envVariables,
  runtimeType
}: CopyDeployFilesToFolderArgs) {
  const indexJsFile = files.find((file) => file.injectExport);
  const indexHtmlFile = files.find((file) => file.injectHTML);
  const otherFiles = files.filter((f) => f !== indexJsFile && f !== indexHtmlFile);

  const otherFilesPromises = otherFiles.map((file) =>
    _writeFileToFolder({ project, direntry, url: file.url, envVariables, runtimeType })
  );

  await Promise.all([
    ...otherFilesPromises,
    writeIndexFiles({
      project,
      direntry,
      exportJson,
      indexJsFile,
      indexHtmlFile,
      baseUrl,
      // TODO: Make enableHash a global option? I dont want it for SSR
      enableHash: runtimeType === 'deploy',
      runtimeType
    })
  ]);
  // reject({ result: 'failure', message: 'Failed to copy deploy files.' });
}

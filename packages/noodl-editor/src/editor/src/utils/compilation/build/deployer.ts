import { filesystem } from '@noodl/platform';

import { Environment } from '@noodl-models/CloudServices';
import { ProjectModel } from '@noodl-models/projectmodel';

import * as Exporter from '../../exporter';
import { copyProjectFilesToFolder } from './copy';
import { loadDeployIndex, copyDeployFilesToFolder, getExternalFolderPath } from './deploy-index';
import { HtmlProcessor, HtmlProcessorParameters } from './processors/html-processor';

export type DeployToFolderOptions = {
  project: ProjectModel;

  /**
   * The folder that we will publish the files to.
   */
  direntry: string;

  /**
   * The environment we want to publish with.
   */
  environment: Environment | undefined;

  baseUrl: string;

  runtimeType?: string;
  envVariables?: Record<string, string>;
};

/**
 * Deployer is handling all the project deploy to a folder logic.
 *
 * This is also used when deploying to the Cloud
 * where it just copies over the built files.
 */
export async function deployToFolder({
  project,
  direntry,
  environment,
  baseUrl,
  envVariables,
  runtimeType = 'deploy'
}: DeployToFolderOptions) {
  // Check if this is a project folder
  try {
    const projectContent = await filesystem.readJson(direntry + '/project.json');
    if (projectContent) {
      return Promise.reject({ result: 'failure', message: 'Cannot deploy to a project folder.' });
    }

    // There is no project.json, this is not a project folder, good continue with the deploy
  } catch (error) {
    // noop; file doesn't exist
  }

  // Start by copying all files from the project folder to the deploy directory
  await copyProjectFilesToFolder(project._retainedProjectDirectory, direntry);

  // Export project
  const exportJson = Exporter.exportToJSON(project, {
    useBundles: true,
    useBundleHashes: true,
    environment,
    // Remove all the cloud function components
    ignoreComponentFilter: (component) => !component.name.startsWith('/#__cloud__/')
  });

  if (!exportJson) {
    return Promise.reject({ result: 'failure', message: 'Failed to export project.' });
  }

  // Remove all keys from config that require master key
  const configSchema = exportJson.metadata['dbConfigSchema'];
  for (const key in configSchema) {
    if (configSchema[key].masterKeyOnly) delete configSchema[key];
  }

  // Read deploy description
  const index = await loadDeployIndex(`${runtimeType}/index.json`);

  // Copy all deploy files
  await copyDeployFilesToFolder({
    project,
    direntry,
    files: index,
    exportJson,
    baseUrl,
    envVariables,
    runtimeType
  });

  //then the export component bundles
  const dir = direntry + '/noodl_bundles/';
  for (const bundleId in exportJson.componentIndex) {
    if (bundleId !== 'root') {
      const json = JSON.stringify(Exporter.exportComponentBundle(project, bundleId, exportJson.componentIndex));
      if (!filesystem.exists(dir)) {
        await filesystem.makeDirectory(dir);
      }

      await filesystem.writeFile(dir + bundleId + '.json', json);
    }
  }
}

export async function createIndexPage(project: ProjectModel, parameters: HtmlProcessorParameters) {
  // Read deploy description
  const index = await loadDeployIndex('deploy/index.json');

  // Find the "index.html" file
  const indexFile = index.find((entry) => entry.url === 'index.html');
  if (!indexFile) {
    throw new Error('Could not find index.html in deploy index.');
  }

  // Read the index.html file
  const indexFilePath = filesystem.join(getExternalFolderPath(), 'deploy', indexFile.url);
  const indexContent = await filesystem.readFile(indexFilePath);

  const htmlProcessor = new HtmlProcessor(project);
  const content = await htmlProcessor.process(indexContent, parameters);

  return content;
}

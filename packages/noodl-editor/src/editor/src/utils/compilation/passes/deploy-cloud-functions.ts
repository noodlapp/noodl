import { filesystem, platform } from '@noodl/platform';

import { BuildScript, NotifyType } from '@noodl-utils/compilation/build-context';
import { exportComponentsToJSON } from '@noodl-utils/exporter';

type CloudRuntimeManifest = {
  version: string;
};

/**
 * Gives the path to the "external" folder.
 * @returns
 */
function getExternalFolderPath() {
  return filesystem.join(platform.getAppPath(), 'src/external');
}

/**
 * Loads the cloud runtime manifest file.
 * @returns
 */
function loadCloudRutimeManifest(): Promise<CloudRuntimeManifest> {
  const indexPath = filesystem.join(getExternalFolderPath(), 'cloudruntime/manifest.json');
  return filesystem.readJson(indexPath);
}

export const deployCloudFunctionBuildScript: BuildScript = {
  // Called Pre Build
  async onPreBuild(context) {
    // Extract all the __cloud__ components
    const components = context.project.getComponents().filter((x) => x.name.startsWith('/#__cloud__/'));
    if (components.length === 0) {
      return;
    }

    // Check if we are deploying with a cloud service
    const environment = context.environment;
    if (!environment) {
      context.notify(NotifyType.Error, 'No cloud service to deploy cloud functions to.');
      return;
    }

    await context.activity(
      {
        message: `Deploying Cloud functions to ${environment.name}.`,
        successMessage: `Successfully deployed Cloud functions to ${environment.name}.`
      },
      async () => {
        const exportedComponents = exportComponentsToJSON(context.project, components, {
          useBundles: false,
          environment: context.environment
        });

        // Delete some data we don't care about on the backend.
        if (exportedComponents.metadata) {
          delete exportedComponents.metadata.variants;
          delete exportedComponents.metadata.styles;
        }

        delete exportedComponents.componentIndex;

        const json = JSON.stringify(exportedComponents);

        // Deploy functions to the backend
        console.log('Deploying cloud functions to:' + environment.url);
        const manifest = await loadCloudRutimeManifest();
        console.log(' - Using cloud runtime version: ' + manifest.version);

        try {
          const response = await fetch(environment.url + '/functions-admin/deploy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Parse-Application-Id': environment.appId,
              'X-Parse-Master-Key': environment.masterKey
            },
            body: JSON.stringify({
              // Project ID, let the server know about which project is pushing changes.
              projectId: context.project.id,
              projectName: context.project.name,
              deploy: json,
              runtime: manifest.version
            })
          });

          // NOTE: Expecting that we always get a JSON response
          const responseContent = await response.json();
          if (responseContent.status !== 'success') {
            throw new Error('Error while deploying: ' + JSON.stringify(responseContent));
          }

          const version = responseContent.version;
          // NOTE: We cannot change "cloudservices" since that is updated exportToJSON
          context.project.metadata.cloudfunctions = {
            version
          };
        } catch (e) {
          console.log('Error while deploying: ', e);
          throw e;
        }
      }
    );
  }
};

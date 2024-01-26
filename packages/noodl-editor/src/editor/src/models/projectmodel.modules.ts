import { filesystem } from '@noodl/platform';
import { bugtracker } from '@noodl-utils/bugtracker';

// TODO: Can we merge this with ProjectModules ?

export type ProjectModule = {
  main?: string;
  name: string;
  type: 'iconset' | undefined;
  icons?: string[];
  iconClass?: string;
  dependencies?: string[];
  browser?: {
    stylesheets?: string[];
  };
};

export interface ProjectModuleManifest {
  name: string;
  manifest: TSFixme;
}

export async function listProjectModules(project: TSFixme /* ProjectModel */): Promise<ProjectModuleManifest[]> {
  var modules: {
    name: string;
    manifest: any;
  }[] = [];

  const modulesPath = project._retainedProjectDirectory + '/noodl_modules';
  const files = await filesystem.listDirectory(modulesPath);

  await Promise.all(
    files.map(async (file) => {
      if (file.isDirectory) {
        const manifestPath = filesystem.join(modulesPath, file.name, 'manifest.json');
        const manifest = await filesystem.readJson(manifestPath);

        modules.push({
          name: file.name,
          manifest
        });
      }
    })
  );

  return modules;
}

export async function readProjectModules(project: TSFixme /* ProjectModel */): Promise<ProjectModule[]> {
  bugtracker.debug('ProjectModel.readModules');

  const modulesPath = project._retainedProjectDirectory + '/noodl_modules';
  const files = await filesystem.listDirectory(modulesPath);

  project.modules = [];
  project.previews = [];
  project.componentAnnotations = {};

  await Promise.all(
    files.map(async (file) => {
      if (file.isDirectory) {
        const manifestPath = filesystem.join(modulesPath, file.name, 'manifest.json');
        const manifest = await filesystem.readJson(manifestPath);

        if (manifest) {
          manifest.name = file.name;
          project.modules.push(manifest);

          if (manifest.componentAnnotations) {
            for (var comp in manifest.componentAnnotations) {
              var ca = manifest.componentAnnotations[comp];

              if (!project.componentAnnotations[comp]) project.componentAnnotations[comp] = {};
              for (var key in ca) project.componentAnnotations[comp][key] = ca[key];
            }
          }

          if (manifest.previews) {
            project.previews = manifest.previews.concat(project.previews);
          }
        }
      }
    })
  );

  console.log(`Loaded ${project.modules.length} modules`);

  return project.modules;
}

import { ComponentModel } from '@noodl-models/componentmodel';
import { CloudServiceMetadataDataFormat, ProjectModel } from '@noodl-models/projectmodel';
import { getComponentIndex, removeBundlesFromIndex } from './bundler';
import { getRouterIndex } from './router';
import { exportComponent, exportSettings, exportVariant } from './util';

import { createHash } from './hash/xxhash64';
import { Environment } from '@noodl-models/CloudServices';

export type ExportToJSONOptions = {
  useBundles?: boolean;
  useBundleHashes?: boolean;

  environment?: Environment | undefined;

  ignoreComponentFilter?: (component: ComponentModel) => boolean;
};

export function exportComponentsToJSON(
  projectModel: ProjectModel,
  components: ComponentModel[],
  args: ExportToJSONOptions
) {
  if (!projectModel) throw new Error('projectModel is null');

  const json: TSFixme = {};

  // Find visual root and the component that contains it
  const root = projectModel.getRootNode();
  if (!root) return;

  const rootComponent = root.owner.owner;
  const project = rootComponent.owner;
  json.settings = exportSettings(project);

  json.components = components.map((component) => exportComponent(component));
  json.componentIndex = {};

  json.metadata = project ? project.metadata : undefined;

  // Take a copy of metadata so that it can be modified without affecting the original
  json.metadata = project?.metadata ? JSON.parse(JSON.stringify(project.metadata)) : {};

  // Override the cloud services metadata
  if (args?.environment === null) {
    json.metadata['cloudservices'] = <CloudServiceMetadataDataFormat>{
      instanceId: undefined,
      endpoint: undefined,
      appId: undefined
    };
  } else if (args?.environment) {
    json.metadata['cloudservices'] = <CloudServiceMetadataDataFormat>{
      instanceId: args.environment.id,
      endpoint: args.environment.url,
      appId: args.environment.appId,
      deployVersion: json.metadata['cloudfunctions']?.version
    };
  }

  return json;
}

export function exportToJSON(projectModel: ProjectModel, args?: ExportToJSONOptions) {
  if (!projectModel) throw new Error('projectModel is null');

  const json: TSFixme = {};

  let allComponents = projectModel.getComponents();

  if (args?.ignoreComponentFilter) {
    allComponents = allComponents.filter(args.ignoreComponentFilter);
  }

  // Find visual root and the component that contains it
  const root = projectModel.getRootNode();
  if (!root) return;

  const rootComponent = root.owner.owner;
  if (!rootComponent || !allComponents.find((c) => c.name === rootComponent.name)) {
    //the root component is not part of the project (probably got deleted)
    return;
  }

  const project = rootComponent.owner;
  json.settings = exportSettings(project);

  if (args?.useBundles === false) {
    json.components = allComponents.map((component) => exportComponent(component));
    json.componentIndex = {};
  } else {
    const componentIndex = getComponentIndex(rootComponent, allComponents);

    // to reduce initial load time, remove the root bundle
    // and export it, with dependencies, directly into the JSON
    // note: the first bundle always contain the root component

    //name of root bundle and all bundle dependencies
    const rootBundleNames = ['b0', ...componentIndex.b0.dependencies];

    //get all those bundles and extract the components from each
    const rootComponents = rootBundleNames.map((name) => componentIndex[name].components).flat();

    //remove bundles from the index since they're now "burnt" into the export and will
    //always be present
    removeBundlesFromIndex(componentIndex, rootBundleNames);

    json.components = rootComponents.map((name) => exportComponent(allComponents.find((c) => c.name === name)));
    json.componentIndex = args?.useBundleHashes
      ? createIndexWithHashedNames(componentIndex, allComponents)
      : componentIndex;
  }

  json.routerIndex = getRouterIndex(allComponents);

  json.rootComponent = rootComponent.name;
  json.rootNode = root.id;

  json.metadata = project ? project.metadata : undefined;

  // Take a copy of metadata so that it can be modified without affecting the original
  json.metadata = project?.metadata ? JSON.parse(JSON.stringify(project.metadata)) : {};

  // Override the cloud services metadata
  if (args?.environment === null) {
    json.metadata['cloudservices'] = <CloudServiceMetadataDataFormat>{
      instanceId: undefined,
      endpoint: undefined,
      appId: undefined
    };
  } else if (args?.environment) {
    json.metadata['cloudservices'] = <CloudServiceMetadataDataFormat>{
      instanceId: args.environment.id,
      endpoint: args.environment.url,
      appId: args.environment.appId,
      deployVersion: json.metadata['cloudfunctions']?.version
    };
  }

  json.variants = projectModel.variants.map((v) => exportVariant(v));

  return json;
}

export function exportComponentBundle(project: ProjectModel, id: TSFixme, componentIndex: TSFixme) {
  const allComponents = project.getComponents();
  return componentIndex[id].components.map((name) => exportComponent(allComponents.find((c) => c.name === name)));
}

//calculate new names for the bundles based on the contents of them so we get new file names everytime the contents change to avoid browser caching issues
function createIndexWithHashedNames(componentIndex, allComponents: ComponentModel[]) {
  const oldToNewNames = new Map<string, string>();

  const allComponentsExported = allComponents.map((component) => exportComponent(component));

  for (const name of Object.keys(componentIndex)) {
    const bundle = componentIndex[name];

    const components = bundle.components
      .map((componentName) => allComponentsExported.find((c) => c.name === componentName))
      .filter((c) => !!c);

    const hash = createHash();
    hash.update(JSON.stringify(components), 'utf8');
    const hex = hash.digest('hex');
    const newName = name + '-' + hex;

    oldToNewNames.set(name, newName);
  }

  const newComponentIndex = {};
  for (const name of Object.keys(componentIndex)) {
    const bundle = JSON.parse(JSON.stringify(componentIndex[name]));
    bundle.dependencies = bundle.dependencies.map((d) => oldToNewNames.get(d));
    newComponentIndex[oldToNewNames.get(name)] = bundle;
  }

  return newComponentIndex;
}

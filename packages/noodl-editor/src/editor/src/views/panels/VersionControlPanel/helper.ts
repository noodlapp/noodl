import path from 'node:path';
import { FileChange, FileStatusKind } from '@noodl/git/src/core/models/status';
import { getBlobContents } from '@noodl/git/src/core/show';
import { filesystem } from '@noodl/platform';

import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeGraphModel } from '@noodl-models/nodegraphmodel';
import { ProjectModel } from '@noodl-models/projectmodel';

import { EventDispatcher } from '../../../../../shared/utils/EventDispatcher';
import { ToastLayer } from '../../ToastLayer/ToastLayer';

export function resetComponent(baseProjectJson: TSFixme, componentName: string) {
  const activityId = 'resetting-component';
  ToastLayer.showActivity('Resetting component', activityId);

  //get previous version of component
  const baseCompJson = baseProjectJson.components.find((c) => c.name === componentName);
  const currentComponent = ProjectModel.instance.getComponentWithName(componentName);

  if (currentComponent && baseCompJson) {
    const isReplacingRootComponent = ProjectModel.instance.getRootComponent() === currentComponent;

    //we're resetting to a previous version of the same component
    //Do this by just replacing the graph, so we don't trigger ComponentRemoved and other events
    //that might affect Page Routers and have other unwanted side effects
    const graph = NodeGraphModel.fromJSON(baseCompJson.graph);
    currentComponent.bindGraph(graph);
    currentComponent.graph.evaluateHealth(); //update warnings

    if (isReplacingRootComponent) {
      //previous version of the component might have a different root node
      ProjectModel.instance.setRootComponent(currentComponent);
    }

    //reload viewers so they get a new export
    EventDispatcher.instance.emit('viewer-refresh');
  } else if (currentComponent) {
    //there is no old version, so this is a new component, delete it
    ProjectModel.instance.removeComponent(currentComponent);
  } else if (baseCompJson) {
    //the current version has been deleted, so add it back
    ProjectModel.instance.addComponent(ComponentModel.fromJSON(baseCompJson));
  }

  ToastLayer.hideActivity(activityId);
  ToastLayer.showSuccess('Component reset');
}

export async function resetFile(
  project: ProjectModel,
  change: FileChange,
  respositoryPath: string,
  currentCommitSha: string
) {
  const activityId = 'resetting-file';
  ToastLayer.showActivity('Resetting file', activityId);

  const fullPath = path.join(project._retainedProjectDirectory, change.path);

  try {
    if (change.status.kind === FileStatusKind.Untracked) {
      await filesystem.removeFile(fullPath);
    } else if (change.status.kind === FileStatusKind.Modified || change.status.kind === FileStatusKind.Deleted) {
      const fileContent = await getBlobContents(respositoryPath, currentCommitSha, change.path);
      if (!fileContent) {
        throw "Couldn't get previous version of the file";
      }

      await filesystem.writeFile(fullPath, fileContent);
    } else {
      throw `No support for resetting file status ${change.status.kind} yet`;
    }

    ToastLayer.hideActivity(activityId);
    ToastLayer.showSuccess('File reset');
  } catch (e) {
    ToastLayer.hideActivity(activityId);
    ToastLayer.showError('Failed to delete file. ' + e.toString());
  }
}

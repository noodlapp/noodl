import path from 'path';
import { getCommit } from '@noodl/git/src/core/logs';
import { FileStatusKind } from '@noodl/git/src/core/models/status';

import { FeedbackType } from '@noodl-constants/FeedbackType';
import { applyPatches } from '@noodl-models/ProjectPatches/applypatches';
import {
  ProjectDiff,
  ProjectDiffItem,
  ProjectBasicDiffItem,
  ArrayDiff,
  diffProject,
  createEmptyArrayDiff
} from '@noodl-utils/projectmerger.diff';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { ListItemProps } from '@noodl-core-ui/components/layout/ListItem';

import { ProjectModel } from '../../../../models/projectmodel';

export interface ProjectLocalDiff extends ProjectDiff {
  baseProject: TSFixme; //Project model as an object from raw json
  commitShaDiffedTo: string;
}

export type ComponentChange = {
  status: FileStatusKind;
  component: ProjectDiffItem;
};

export function getChangedComponents(components: ArrayDiff<ProjectDiffItem>): ComponentChange[] {
  const items = components.changed
    .map((c) => ({ status: FileStatusKind.Modified, component: c }))
    .concat(components.created.map((c) => ({ status: FileStatusKind.New, component: c })))
    .concat(components.deleted.map((c) => ({ status: FileStatusKind.Deleted, component: c })));

  items.sort((a, b) => {
    if (a.component.name < b.component.name) return -1;
    return a.component.name > b.component.name ? 1 : 0;
  });

  return items;
}

export type ObjectPropertyChange = {
  status: FileStatusKind;
  property: ProjectBasicDiffItem;
};

export function getChangedObjectProperties(properties: ArrayDiff<ProjectBasicDiffItem>): ObjectPropertyChange[] {
  const items = properties.changed
    .map((property) => ({ status: FileStatusKind.Modified, property }))
    .concat(properties.created.map((property) => ({ status: FileStatusKind.New, property })))
    .concat(properties.deleted.map((property) => ({ status: FileStatusKind.Deleted, property })));

  items.sort((a, b) => {
    if (a.property.name < b.property.name) return -1;
    return a.property.name > b.property.name ? 1 : 0;
  });

  return items;
}

export function getFileStatusIconProps(status: FileStatusKind): Partial<ListItemProps> {
  switch (status) {
    case FileStatusKind.Copied:
    case FileStatusKind.Untracked:
    case FileStatusKind.New:
      return {
        icon: IconName.Plus,
        iconVariant: FeedbackType.Success
      };

    case FileStatusKind.Renamed:
    case FileStatusKind.Conflicted:
    case FileStatusKind.Modified:
      return {
        icon: IconName.DotsThreeHorizontal,
        iconVariant: FeedbackType.Notice
      };

    case FileStatusKind.Deleted:
      return {
        icon: IconName.Minus,
        iconVariant: FeedbackType.Danger
      };
  }
}

export function getProjectFilePath(repositoryPath: string, projectPath: string) {
  const relativePath = path.relative(repositoryPath, projectPath);
  const projectFilePath = path.join(relativePath, 'project.json').replaceAll('\\', '/');
  return projectFilePath;
}

export async function doLocalDiff(
  repositoryPath: string,
  projectPath: string,
  headCommitId: string
): Promise<ProjectLocalDiff> {
  const projectFilePath = getProjectFilePath(repositoryPath, projectPath);

  try {
    const baseCommit = await getCommit(projectPath, headCommitId);
    const baseProjectJson = await baseCommit.getFileAsString(projectFilePath);
    const baseProject = JSON.parse(baseProjectJson);
    applyPatches(baseProject);

    const diff = diffProject(baseProject, ProjectModel.instance.toJSON());

    return {
      ...diff,
      baseProject,
      commitShaDiffedTo: headCommitId
    };
  } catch (error) {
    if (error.toString().includes('exists on disk, but not in')) {
      console.warn('project.json does not exist in this commit.');
    }

    // Return empty state
    return {
      baseProject: {},
      commitShaDiffedTo: headCommitId,
      components: createEmptyArrayDiff(),
      variants: createEmptyArrayDiff(),
      settings: createEmptyArrayDiff(),
      styles: {
        colors: createEmptyArrayDiff(),
        text: createEmptyArrayDiff()
      },
      cloudservices: createEmptyArrayDiff()
    };
  }
}

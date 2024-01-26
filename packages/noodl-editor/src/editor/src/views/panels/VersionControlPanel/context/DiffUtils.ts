import {
  ProjectDiff,
  ProjectDiffItem,
  ProjectBasicDiffItem,
  ArrayDiff,
  diffProject
} from '@noodl-utils/projectmerger.diff';

import { ProjectModel } from '../../../../models/projectmodel';

import { applyPatches } from '@noodl-models/ProjectPatches/applypatches';
import { FileStatusKind } from '@noodl/git/src/core/models/status';
import { IconName } from '@noodl-core-ui/components/common/Icon';
import { ListItemProps } from '@noodl-core-ui/components/layout/ListItem';
import { FeedbackType } from '@noodl-constants/FeedbackType';
import { getCommit } from '@noodl/git/src/core/logs';

export interface ProjectLocalDiff extends ProjectDiff{
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

export async function doLocalDiff(repositoryPath: string, headCommitId: string): Promise<ProjectLocalDiff> {
  const baseCommit = await getCommit(repositoryPath, headCommitId);
  const baseProjectJson = await baseCommit.getFileAsString('project.json');
  const baseProject = JSON.parse(baseProjectJson);
  applyPatches(baseProject);

  const diff = diffProject(baseProject, ProjectModel.instance.toJSON());

  return {
    ...diff,
    baseProject,
    commitShaDiffedTo: headCommitId
  };
}

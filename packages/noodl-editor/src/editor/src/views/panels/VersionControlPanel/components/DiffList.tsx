import path from 'node:path';
import { isBinaryFile } from 'isbinaryfile';
import React, { useEffect, useState } from 'react';
import { DiffType, IDiff, IImageDiff, Image, ITextDiff } from '@noodl/git/src/core/models/diff-data';
import { Commit } from '@noodl/git/src/core/models/snapshot';
import { FileChange, FileStatusKind, isFileImage } from '@noodl/git/src/core/models/status';
import { getBlobBinaryContents } from '@noodl/git/src/core/show';
import { filesystem, PromiseUtils } from '@noodl/platform';

import { ComponentModel } from '@noodl-models/componentmodel';
import { NodeLibrary } from '@noodl-models/nodelibrary';
import { ProjectModel } from '@noodl-models/projectmodel';
import { ProjectDiff, ProjectDiffItem } from '@noodl-utils/projectmerger.diff';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { ConditionalContainer } from '@noodl-core-ui/components/layout/ConditionalContainer';
import { ListItem, ListItemVariant } from '@noodl-core-ui/components/layout/ListItem';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Label } from '@noodl-core-ui/components/typography/Label';

import { CodeDiffDialog } from '../../../documents/ComponentDiffDocument/CodeDiffDialog';
import { ImageDiffDialog } from '../../../documents/ComponentDiffDocument/ImageDiffDialog';
import { useVersionControlContext } from '../context';
import {
  ComponentChange,
  getChangedComponents,
  getChangedObjectProperties,
  getFileStatusIconProps,
  ObjectPropertyChange
} from '../context/DiffUtils';
import { useShowComponentDiffDocument } from '../hooks/useShowComponentDiffDocument';

interface DiffListActionProps<T> {
  icon: IconName;
  onClick: (change: T) => void;
}

interface DiffListProps {
  diff: ProjectDiff;
  fileChanges: readonly FileChange[];
  componentDiffTitle: string;
  commit?: Commit; //Set this when diffing a component and not local changes
  actions?: {
    component?: DiffListActionProps<ComponentChange>;
    file?: DiffListActionProps<FileChange>;
    setting?: DiffListActionProps<ObjectPropertyChange>;
    textStyle?: DiffListActionProps<ObjectPropertyChange>;
    colorStyle?: DiffListActionProps<ObjectPropertyChange>;
    cloudservice?: DiffListActionProps<ObjectPropertyChange>;
  };
}

export function DiffList({ diff, fileChanges, componentDiffTitle, actions, commit }: DiffListProps) {
  const { repositoryPath, fetch } = useVersionControlContext();
  const { currentCommitSha } = fetch;

  const [activeComponent, setActiveComponent] = useState<ComponentModel>(null);
  const [codeDiff, setCodeDiff] = useState<ITextDiff>(null);
  const [imageDiff, setImageDiff] = useState<IImageDiff>(null);

  const components = diff?.components ? getChangedComponents(diff.components) : [];
  const files = (fileChanges || [])?.filter((f) => !f.path.endsWith('project.json')) || [];
  const settings = diff?.settings ? getChangedObjectProperties(diff.settings) : [];
  const colorStyles = diff?.styles.colors ? getChangedObjectProperties(diff.styles.colors) : [];
  const textStyles = diff?.styles.text ? getChangedObjectProperties(diff.styles.text) : [];
  const cloudservices = diff?.cloudservices ? getChangedObjectProperties(diff.cloudservices) : [];

  const cloudKey = '/#__cloud__';
  const frontendComponents = components.filter((x) => !x.component.name.startsWith(cloudKey));
  const backendComponents = components.filter((x) => x.component.name.startsWith(cloudKey));

  useEffect(() => {
    //make sure the active component exists in the diff. This can be false if a component is reset
    if (activeComponent && !components.find((c) => c.component.name === activeComponent.fullName)) {
      setActiveComponent(null);
    }
  }, [components, activeComponent]);

  useShowComponentDiffDocument({
    component: activeComponent,
    title: componentDiffTitle,
    onDocumentClosed: () => setActiveComponent(null)
  });

  function onComponentClicked(change: ComponentChange) {
    if (componentId(activeComponent) === componentId(change.component)) {
      setActiveComponent(null);
      return;
    }

    //ComponentModel.fromJSON will trigger lots of global Model.* events, causing the project to save, which triggers the diff
    //Fix this by stopping the project from saving
    ProjectModel.setSaveOnModelChange(false);
    const componentModel = ComponentModel.fromJSON(change.component);
    ProjectModel.setSaveOnModelChange(true);

    setActiveComponent(componentModel);
  }

  const numChanges = components.length + files.length + settings.length + colorStyles.length + textStyles.length;

  return (
    <ConditionalContainer
      doRenderWhen={diff !== null}
      loaderVisibilityDelayMs={0}
      UNSAFE_root_style={{ width: '100%' }}
    >
      <CodeDiffDialog onClose={() => setCodeDiff(null)} diff={codeDiff} />
      {Boolean(imageDiff) && <ImageDiffDialog onClose={() => setImageDiff(null)} diff={imageDiff} />}

      {numChanges == 0 && (
        <Section hasGutter variant={SectionVariant.PanelShy}>
          <Label>No changes</Label>
        </Section>
      )}

      <VStack>
        {Boolean(frontendComponents?.length > 0) && (
          <Section title="Changed Components" variant={SectionVariant.PanelShy} hasBottomSpacing hasVisibleOverflow>
            {frontendComponents.map((change) => (
              <ListItem
                key={'component_' + componentId(change.component)}
                text={change.component.name}
                variant={
                  componentId(activeComponent) === componentId(change.component)
                    ? ListItemVariant.Active
                    : ListItemVariant.Default
                }
                {...getFileStatusIconProps(change.status)}
                {...getActionProps(actions?.component, change)}
                onClick={() => onComponentClicked(change)}
              />
            ))}
          </Section>
        )}

        {Boolean(backendComponents?.length > 0) && (
          <Section
            title="Changed Cloud Components"
            variant={SectionVariant.PanelShy}
            hasBottomSpacing
            hasVisibleOverflow
          >
            {backendComponents.map((change) => (
              <ListItem
                key={'cloud_component_' + componentId(change.component)}
                text={change.component.name.substring(cloudKey.length)}
                variant={
                  componentId(activeComponent) === componentId(change.component)
                    ? ListItemVariant.Active
                    : ListItemVariant.Default
                }
                {...getFileStatusIconProps(change.status)}
                {...getActionProps(actions?.component, change)}
                onClick={() => onComponentClicked(change)}
              />
            ))}
          </Section>
        )}

        {Boolean(files?.length > 0) && (
          <Section title="Changed Files" variant={SectionVariant.PanelShy} hasBottomSpacing hasVisibleOverflow>
            {files.map((change) => (
              <ListItem
                key={'file_' + change.id}
                text={change.path}
                onClick={async () => {
                  const diff = await getFileDiff(repositoryPath, change, currentCommitSha, commit);
                  switch (diff.kind) {
                    case DiffType.Text:
                      setCodeDiff(diff);
                      break;

                    case DiffType.Image:
                      setImageDiff(diff);
                      break;
                  }
                }}
                {...getFileStatusIconProps(change.status.kind)}
                {...getActionProps(actions?.file, change)}
              />
            ))}
          </Section>
        )}

        {Boolean(settings.length > 0) && (
          <Section title="Changed Settings" variant={SectionVariant.PanelShy} hasBottomSpacing hasVisibleOverflow>
            {settings.map((change) => {
              return (
                <ListItem
                  key={'setting_' + change.property.name}
                  text={getSettingDisplayName(change.property.name)}
                  onClick={() => {
                    setCodeDiff({
                      kind: DiffType.Text,
                      original: change.property.oldValue,
                      modified: change.property.value
                    });
                  }}
                  {...getFileStatusIconProps(change.status)}
                  {...getActionProps(actions?.setting, change)}
                />
              );
            })}
          </Section>
        )}

        {Boolean(colorStyles.length > 0) && (
          <Section title="Changed Color Styles" variant={SectionVariant.PanelShy} hasBottomSpacing hasVisibleOverflow>
            {colorStyles.map((change) => {
              return (
                <ListItem
                  key={'style_color_' + change.property.name}
                  text={change.property.name}
                  onClick={() => {
                    setCodeDiff({
                      kind: DiffType.Text,
                      original: change.property.oldValue,
                      modified: change.property.value
                    });
                  }}
                  {...getFileStatusIconProps(change.status)}
                  {...getActionProps(actions?.colorStyle, change)}
                />
              );
            })}
          </Section>
        )}

        {Boolean(textStyles.length > 0) && (
          <Section title="Changed Text Styles" variant={SectionVariant.PanelShy} hasBottomSpacing hasVisibleOverflow>
            {textStyles.map((change) => {
              return (
                <ListItem
                  key={'style_text_' + change.property.name}
                  text={change.property.name}
                  onClick={() => {
                    setCodeDiff({
                      kind: DiffType.Text,
                      original: change.property.oldValue,
                      modified: change.property.value
                    });
                  }}
                  {...getFileStatusIconProps(change.status)}
                  {...getActionProps(actions?.textStyle, change)}
                />
              );
            })}
          </Section>
        )}

        {Boolean(cloudservices.length > 0) && (
          <Section title="Other" variant={SectionVariant.PanelShy} hasBottomSpacing hasVisibleOverflow>
            <ListItem
              text="Active editor cloud service"
              onClick={() => {
                setCodeDiff({
                  kind: DiffType.Text,
                  original: cloudservices[0].property.oldValue,
                  modified: cloudservices[0].property.value
                });
              }}
              {...getFileStatusIconProps(cloudservices[0].status)}
              {...getActionProps(actions?.cloudservice, cloudservices[0])}
            />
          </Section>
        )}
      </VStack>
    </ConditionalContainer>
  );
}

export function getSettingDisplayName(portName: string) {
  const ports = NodeLibrary.instance.getProjectSettingsPorts();
  const allPorts = (ports.ports || []).concat(ports.dynamicports || []);
  const p = allPorts.find((p) => p.name === portName);

  return (p?.group || 'Other') + ': ' + (p?.displayName || portName);
}

//sometimes components don't have IDs
function componentId(component: ProjectDiffItem) {
  return component?.id || component?.name;
}

function getActionProps(action: DiffListActionProps<unknown>, change: unknown) {
  return {
    isShowingAffixOnHover: !!action,
    affix: Boolean(action) && (
      <IconButton
        variant={IconButtonVariant.SemiTransparent}
        size={IconSize.Small}
        icon={action.icon}
        onClick={(e) => {
          action.onClick(change);
          e.stopPropagation();
        }}
      />
    )
  };
}

async function getFileDiff(
  repositoryPath: string,
  change: FileChange,
  currentCommitSha: string,
  commit?: Commit
): Promise<IDiff> {
  if (change.status.kind === FileStatusKind.Modified) {
    if (commit) {
      // compare against parent commit
      if (commit.parentSHAs[0]) {
        return await diff_fromSHA(repositoryPath, change, commit.parentSHAs[0], commit.sha);
      }
    } else {
      // compare against working dir content
      const fullPath = path.join(ProjectModel.instance._retainedProjectDirectory, change.path);

      const { current, previous } = await PromiseUtils.allObjects({
        current: filesystem.readBinaryFile(fullPath),
        previous: getBlobBinaryContents(repositoryPath, currentCommitSha, change.path)
      });

      return await diff_fromBuffers(change, previous, current);
    }
  } else if (change.status.kind === FileStatusKind.New && commit) {
    const current = await getBlobBinaryContents(repositoryPath, commit.sha, change.path);

    return await diff_fromBuffers(change, null, current);
  } else if (change.status.kind === FileStatusKind.Untracked) {
    const fullPath = path.join(ProjectModel.instance._retainedProjectDirectory, change.path);
    const current = await filesystem.readBinaryFile(fullPath);

    return await diff_fromBuffers(change, null, current);
  } else if (change.status.kind === FileStatusKind.Deleted) {
    // if this is a local change we're reading from the latest commit.
    // if this is a commit we're diffing we need to read from its parent
    const sha = commit ? commit.parentSHAs[0] : currentCommitSha;
    const current = await getBlobBinaryContents(repositoryPath, sha, change.path);

    return await diff_fromBuffers(change, null, current);
  }

  return {
    kind: DiffType.Unrenderable
  };
}

async function diff_fromSHA(
  repositoryPath: string,
  change: FileChange,
  previousSHA: string,
  currentSHA: string
): Promise<IDiff> {
  const { current, previous } = await PromiseUtils.allObjects({
    current: getBlobBinaryContents(repositoryPath, currentSHA, change.path),
    previous: getBlobBinaryContents(repositoryPath, previousSHA, change.path)
  });

  return await diff_fromBuffers(change, previous, current);
}

async function diff_fromBuffers(change: FileChange, previous: Buffer | null, current: Buffer): Promise<IDiff> {
  const { currentIsBinary, previousIsBinary } = await PromiseUtils.allObjects({
    currentIsBinary: isBinaryFile(current),
    previousIsBinary: previous ? isBinaryFile(previous) : Promise.resolve(undefined)
  });

  const isBinary = currentIsBinary && (previousIsBinary || !previous);

  if (isBinary && isFileImage(change)) {
    return {
      kind: DiffType.Image,
      original: previous ? Image.fromBinary(change, previous) : undefined,
      modified: Image.fromBinary(change, current)
    };
  }

  if (!isBinary) {
    return {
      kind: DiffType.Text,
      original: previous ? previous.toString('utf-8') : undefined,
      modified: current.toString('utf-8')
    };
  }

  return {
    kind: DiffType.Binary
  };
}

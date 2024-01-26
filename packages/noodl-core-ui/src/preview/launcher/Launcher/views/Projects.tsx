import React, { useRef, useState } from 'react';

import { Icon, IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Select, SelectColorTheme, SelectOption } from '@noodl-core-ui/components/inputs/Select';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Columns } from '@noodl-core-ui/components/layout/Columns';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { LauncherPage } from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherPage';
import {
  CloudSyncType,
  LauncherProjectCard,
  LauncherProjectData
} from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherProjectCard';
import {
  LauncherSearchBar,
  useLauncherSearchBar
} from '@noodl-core-ui/preview/launcher/Launcher/components/LauncherSearchBar';
import { ProjectSettingsModal } from '@noodl-core-ui/preview/launcher/Launcher/components/ProjectSettingsModal';
import { MOCK_PROJECTS } from '@noodl-core-ui/preview/launcher/Launcher/Launcher';

export interface ProjectsViewProps {}

export function Projects({}: ProjectsViewProps) {
  const allProjects = MOCK_PROJECTS;

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const uniqueTypes = [...new Set(allProjects.map((item) => item.cloudSyncMeta.type))];
  const visibleTypesDropdownItems: SelectOption[] = [
    { label: 'All projects', value: 'all' },
    ...uniqueTypes.map((type) => ({ label: `Only ${type.toLowerCase()} projects`, value: type }))
  ];

  const {
    items: projects,
    filterValue,
    setFilterValue,
    searchTerm,
    setSearchTerm
  } = useLauncherSearchBar({
    allItems: allProjects,
    filterDropdownItems: visibleTypesDropdownItems,
    propertyNameToFilter: 'cloudSyncMeta.type'
  });

  function onOpenProjectSettings(projectDataId: LauncherProjectData['id']) {
    setSelectedProjectId(projectDataId);
  }

  function onCloseProjectSettings() {
    setSelectedProjectId(null);
  }

  function onImportProjectClick() {
    alert('FIXME: Import project');
  }

  function onNewProjectClick() {
    alert('FIXME: Create new project');
  }

  return (
    <LauncherPage
      title="Recent Projects"
      headerSlot={
        <HStack hasSpacing>
          <PrimaryButton
            label="Open project"
            size={PrimaryButtonSize.Small}
            variant={PrimaryButtonVariant.Muted}
            onClick={onImportProjectClick}
          />
          <PrimaryButton label="Create new project" size={PrimaryButtonSize.Small} onClick={onNewProjectClick} />
        </HStack>
      }
    >
      <ProjectSettingsModal
        isVisible={selectedProjectId !== null}
        onClose={onCloseProjectSettings}
        projectData={projects.find((project) => project.id === selectedProjectId)}
      />

      <LauncherSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        filterDropdownItems={visibleTypesDropdownItems}
      />

      {/* TODO: make project list legend and grid reusable */}
      <Box hasBottomSpacing={4} hasTopSpacing={4}>
        <HStack hasSpacing>
          <div style={{ width: 100 }} />
          <div style={{ width: '100%' }}>
            <Columns layoutString={'1 1 1'}>
              <Label variant={TextType.Shy} size={LabelSize.Small}>
                Name
              </Label>
              <Label variant={TextType.Shy} size={LabelSize.Small}>
                Version control
              </Label>
              <Label variant={TextType.Shy} size={LabelSize.Small}>
                Contributors
              </Label>
            </Columns>
          </div>
        </HStack>
      </Box>
      <Columns layoutString="1" hasXGap hasYGap>
        {projects.map((project) => (
          <LauncherProjectCard
            key={project.id}
            {...project}
            contextMenuItems={[
              {
                label: 'Launch project',
                onClick: () => alert('FIXME: Launch project')
              },
              {
                label: 'Open project folder',
                onClick: () => alert('FIXME: Open folder')
              },
              {
                label: 'Open project settings',
                onClick: () => onOpenProjectSettings(project.id)
              },

              'divider',
              {
                label: 'Delete project',
                onClick: () => alert('FIXME: Delete project'),
                icon: IconName.Trash,
                isDangerous: true
              }
            ]}
          />
        ))}
      </Columns>
    </LauncherPage>
  );
}

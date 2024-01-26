import Path from 'path';
import { useTriggerRerenderState } from '@noodl-hooks/useTriggerRerender';
import React, { useEffect, useState } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { Section } from '@noodl-core-ui/components/sidebar/Section';

import View from '../../../../../shared/view';
import { Frame } from '../../common/Frame';
import { Ports } from '../propertyeditor/DataTypes/Ports';
import { ProjectSettingsModel } from './ProjectSettingsModel';
import { DeploySection } from './sections/DeploySection';
import { SitemapSection } from './sections/SitemapSection';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ProjectSettingsPanelProps {}

// eslint-disable-next-line no-empty-pattern
export function ProjectSettingsPanel({}: ProjectSettingsPanelProps) {
  const [propertyView, setPropertyView] = useState<View | null>(null);
  const [renderIndex, triggerRerender] = useTriggerRerenderState();

  function onOpenProjectFolderClicked() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const shell = require('@electron/remote').shell;
    shell.showItemInFolder(Path.normalize(ProjectModel.instance._retainedProjectDirectory + '/project.json'));
  }

  useEffect(() => {
    const settingsModel = new ProjectSettingsModel();

    const view = new Ports({
      model: settingsModel
    });
    view.render();

    setPropertyView(view);

    settingsModel.on('settingsChanged', () => {
      triggerRerender();
    });

    return function () {
      settingsModel.dispose();
    };
  }, []);

  propertyView?.render();

  return (
    <BasePanel title="Project Settings" hasContentScroll>
      <Section hasGutter hasVisibleOverflow>
        <PrimaryButton
          icon={IconName.FolderOpen}
          size={PrimaryButtonSize.Small}
          label="Open project folder"
          variant={PrimaryButtonVariant.MutedOnLowBg}
          onClick={onOpenProjectFolderClicked}
          isGrowing
        />
      </Section>

      <Frame instance={propertyView} refresh={renderIndex} />

      <SitemapSection />
      <DeploySection />
    </BasePanel>
  );
}

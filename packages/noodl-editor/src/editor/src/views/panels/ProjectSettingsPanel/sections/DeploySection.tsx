import React, { useState } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';

import { Box } from '@noodl-core-ui/components/layout/Box';
import { PropertyPanelCheckbox } from '@noodl-core-ui/components/property-panel/PropertyPanelCheckbox';
import { PropertyPanelRow } from '@noodl-core-ui/components/property-panel/PropertyPanelInput';
import { PropertyPanelTextInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextInput';
import { CollapsableSection } from '@noodl-core-ui/components/sidebar/CollapsableSection';
import { ExperimentalFlag, ExperimentalFlagVariant } from '@noodl-core-ui/components/sidebar/ExperimentalFlag';
import { Text } from '@noodl-core-ui/components/typography/Text';

export function DeploySection() {
  const [enabledDeployDate, setEnabledDeployDate] = useState(!!ProjectModel.instance.settings['deployEnvDate']);
  const [enabledGitStats, setEnabledGitStats] = useState(!!ProjectModel.instance.settings['deployEnvGitStats']);
  const [baseUrl, setBaseUrl] = useState<string>(ProjectModel.instance.settings['baseUrl']);

  function handleBaseUrl(value: string) {
    setBaseUrl(value);
    ProjectModel.instance.setSetting('baseUrl', value);
  }

  function handleEnableDeployDate(value: boolean) {
    setEnabledDeployDate(value);
    ProjectModel.instance.setSetting('deployEnvDate', value);
  }

  function handleEnableGitStats(value: boolean) {
    setEnabledGitStats(value);
    ProjectModel.instance.setSetting('deployEnvGitStats', value);
  }

  return (
    <CollapsableSection title="Experimental features - Deploy Settings" hasGutter hasVisibleOverflow isClosed>
      <ExperimentalFlag
        variant={ExperimentalFlagVariant.NoPadding}
        text="All these settings are temporary and will be moved to another place in a future version."
      />
      <Box hasBottomSpacing>
        <Text>The Base Url.</Text>
      </Box>
      <PropertyPanelRow label="Custom Base Url">
        <PropertyPanelTextInput value={baseUrl} onChange={handleBaseUrl} />
      </PropertyPanelRow>
      <Box hasBottomSpacing>
        <Text>Noodl.Env.BaseUrl: Get the current base url.</Text>
      </Box>
      <Box hasBottomSpacing hasTopSpacing>
        <Text>Include some extra variables in Noodl.Env:</Text>
      </Box>
      <PropertyPanelRow label="Deploy Date">
        <PropertyPanelCheckbox value={enabledDeployDate} onChange={handleEnableDeployDate} />
      </PropertyPanelRow>
      <Box hasBottomSpacing>
        <Text>Noodl.Env.DeployedAt: The deploy date time in UTC format.</Text>
      </Box>
      <PropertyPanelRow label="Git Stats">
        <PropertyPanelCheckbox value={enabledGitStats} onChange={handleEnableGitStats} />
      </PropertyPanelRow>
      <Box hasBottomSpacing>
        <Text>Noodl.Env.GitBranch: The current git branch.</Text>
        <Text>Noodl.Env.GitSha: The current git commit sha.</Text>
      </Box>
    </CollapsableSection>
  );
}

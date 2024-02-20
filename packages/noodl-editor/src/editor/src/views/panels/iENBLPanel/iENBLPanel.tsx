import { useActiveEnvironment } from '@noodl-hooks/useActiveEnvironment';
import React, { useEffect, useState } from 'react';

import { ProjectModel } from '@noodl-models/projectmodel';

import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Container, ContainerDirection } from '@noodl-core-ui/components/layout/Container';
import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';

import { ComponentsPanel } from '../componentspanel';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';
import { NeueService } from '@noodl-models/NeueServices/NeueService';
import { PropertyPanelTextInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextInput';
import { PropertyPanelRow } from '@noodl-core-ui/components/property-panel/PropertyPanelInput';
import { PropertyPanelPasswordInput } from '@noodl-core-ui/components/property-panel/PropertyPanelPasswordInput';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { isComponentModel_NeueRuntime } from '@noodl-utils/NodeGraph';
import { exportComponentsToJSON } from '@noodl-utils/exporter';
import NeueExportModal from '../../NeueConfigurationExport/NeueExportModal';

export function iENBLPanel() {
  const environment = useActiveEnvironment(ProjectModel.instance);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [devices, setDevices] = useState([]);

  const [jsonData, setJsonData] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  useEffect(() => {
    NeueService.instance.load().then((result) => {
      setSignedIn(result);
      if (result) {
        fetchDevices();
      } else {
        setLoading(false);
      }
    });
  }, [setSignedIn, setLoading]);

  const componentPanelOptions = {
    showSheetList: false,
    lockCurrentSheetName: '__neue__',
    componentTitle: 'Neue components'
  };

  function loginClick() {
    setLoading(true);
    NeueService.instance.login(email, password).then(() => {
      setSignedIn(true);
      setLoading(false);
      fetchDevices();
    }).catch((err) => {
      setSignedIn(false);
      setLoading(false);
      setError(err);
    });
  }

  function logoutClick() {
    NeueService.instance.logout();
    setSignedIn(false);
    setLoading(false);
  }

  function fetchDevices() {
    setLoading(true);
    NeueService.instance.fetchDevices().then((response) => {
      setDevices(response);
    }).catch((err) => {
      console.log(err)
    }).finally(() => {
      setLoading(false);
    });
  }

  function handleCloseModal() {
    setJsonData([]);
    setIsExportModalOpen(false)
  }


  async function getJsonConfiguration() {
    const allComponents = ProjectModel.instance.components.filter(comp => isComponentModel_NeueRuntime(comp));

    const json = await exportComponentsToJSON(ProjectModel.instance, allComponents, { useBundleHashes: false, useBundles: true }).components
    //await filesystem.writeJson(__dirname + 'exportTest.json', json);

    setJsonData(json)
    setIsExportModalOpen(!isExportModalOpen)
  }


  return (
    <BasePanel title="Neue Playground" isFill>
      {!signedIn ? (
        <Container direction={ContainerDirection.Vertical} isFill>
          <VStack>
            <PropertyPanelRow label="Email" isChanged={false}>
              <PropertyPanelTextInput value={email} onChange={(value) => setEmail(value)} />
            </PropertyPanelRow>
            <PropertyPanelRow label="Password" isChanged={false}>
              <PropertyPanelPasswordInput value={password} onChange={(value) => setPassword(value)} />
            </PropertyPanelRow>
            {error !== '' ? (
              <Label>
                Invalid email or password...
              </Label>
            ) : null}
            <PrimaryButton label="Login" onClick={loginClick} />
            {loading ? (
              <Container hasLeftSpacing hasTopSpacing>
                <ActivityIndicator />
              </Container>
            ) : null}
          </VStack>
        </Container>
      ) : (
        <Container direction={ContainerDirection.Vertical} isFill>
          <Box hasXSpacing hasYSpacing>
            <VStack>
              <PrimaryButton label="Push Configuration to Device" onClick={getJsonConfiguration} />
            </VStack>
          </Box>
          <Section
            title="Available Devices"
            variant={SectionVariant.Panel}

          >
            {devices.length ? (
              <VStack>
                {devices.map((environment, i) => (
                  <Text style={{ margin: '10px 0px 15px 50px' }} key={i}>{environment}</Text>

                  // <CloudServiceCardItem
                  //   key={environment.id}
                  //   environment={environment}
                  //   deleteEnvironment={deleteEnvironment}
                  // />
                ))}
              </VStack>
            ) : error ? (
              <Box hasXSpacing hasYSpacing>
                <VStack>
                  <Text hasBottomSpacing>Failed to load cloud services</Text>
                  <PrimaryButton label="Try again." />
                </VStack>
              </Box>
            ) : loading ? (
              <Container hasLeftSpacing hasTopSpacing>
                <ActivityIndicator />
              </Container>
            ) : (
              <Container hasLeftSpacing hasTopSpacing>
                <Text>Empty</Text>
              </Container>
            )}
          </Section>
          <div style={{ flex: '1', overflow: 'hidden' }}>
            <ComponentsPanel options={componentPanelOptions} />
          </div>
          <Box hasXSpacing hasYSpacing>
            <VStack>
              <PrimaryButton label="Logout" onClick={logoutClick} />
            </VStack>
          </Box>
        </Container>
      )}

      <NeueExportModal onClose={handleCloseModal} isVisible={isExportModalOpen} jsonData={jsonData} devices={devices} />
    </BasePanel>

  );
}

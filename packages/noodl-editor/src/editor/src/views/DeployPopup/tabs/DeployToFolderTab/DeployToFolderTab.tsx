import { useModernModel } from '@noodl-hooks/useModel';
import React, { useState } from 'react';
import { filesystem } from '@noodl/platform';

import { CloudService } from '@noodl-models/CloudServices';
import { ProjectModel } from '@noodl-models/projectmodel';
import { createEditorCompilation } from '@noodl-utils/compilation/compilation.editor';

import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Select } from '@noodl-core-ui/components/inputs/Select';
import { PopupSection } from '@noodl-core-ui/components/popups/PopupSection';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { TextType } from '@noodl-core-ui/components/typography/Text/Text';

import PopupLayer from '../../../popuplayer';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';
import { NO_ENVIRONMENT_VALUE } from '../../DeployPopup.constants';
import { useEnvironmentsAsOptions } from '../../DeployPopup.hooks';

export function DeployToFolderTab() {
  const cloudService = useModernModel(CloudService.instance);
  const environmentOptions = useEnvironmentsAsOptions(cloudService);

  const [environmentId, setEnvironmentId] = useState<string>(NO_ENVIRONMENT_VALUE);

  function onPickFolderClicked() {
    const activityId = 'deploying-project';

    filesystem
      .openDialog({
        allowCreateDirectory: true
      })
      .then((direntry) => {
        const compilation = createEditorCompilation(ProjectModel.instance)
          .addProjectBuildScripts()
          .addBuildScript({
            async onPreBuild() {
              ToastLayer.showActivity('Deploying', activityId);
            },
            async onPostBuild({ status }) {
              ToastLayer.hideActivity(activityId);
              if (status === 'success') {
                ToastLayer.showSuccess('Deploy successful!');
              } else {
                ToastLayer.showError('Deploy failed.');
              }
            }
          });

        const environment = cloudService.backend.items.find((x) => x.id === environmentId);

        // NOTE: Fire-n-forget
        compilation.deployToFolder(direntry, {
          environment
        });

        // NOTE: To deploy SSR, this will be updated with the new deploy popup design
        // compilation
        //   .deployToFolder(direntry, {
        //     environment,
        //     runtimeType: 'ssr'
        //   })
        //   .then(() => {
        //     compilation.deployToFolder(direntry + '/public', {
        //       environment,
        //     });
        //   });
      });

    PopupLayer.instance.hidePopup();
  }

  return (
    <>
      <PopupSection>
        <Text hasBottomSpacing textType={TextType.DefaultContrast}>
          Deploy your frontend to a local folder
        </Text>

        {Boolean(cloudService.backend.items?.length) && (
          <Select
            options={environmentOptions}
            onChange={(value: string) => setEnvironmentId(value)}
            placeholder="No cloud services"
            value={environmentId}
            label="Connected cloud services"
            hasBottomSpacing
          />
        )}

        <PrimaryButton label="Pick folder" onClick={onPickFolderClicked} />
      </PopupSection>
    </>
  );
}

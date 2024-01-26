import React, { useEffect, useState } from 'react';
import { FileChange } from '@noodl/git/src/core/models/status';

import { ProjectModel } from '@noodl-models/projectmodel';
import { StylesModel } from '@noodl-models/StylesModel';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { useSimpleConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';

import { useVersionControlContext } from '../context';
import { ObjectPropertyChange } from '../context/DiffUtils';
import { resetComponent, resetFile } from '../helper';
import { DiffList, getSettingDisplayName } from './DiffList';

export function LocalChangesDiff() {
  const { fetch, localDiff, localFiles, repositoryPath } = useVersionControlContext();

  const [ResetSingleDialog, confirmSingleReset] = useSimpleConfirmationDialog({
    title: 'Confirm Reset Component',
    confirmButtonLabel: 'Yes, reset',
    isDangerousAction: true
  });

  return (
    <>
      <ResetSingleDialog />

      <DiffList
        componentDiffTitle={`Showing uncommited changes`}
        diff={localDiff}
        fileChanges={localFiles}
        actions={{
          component: {
            icon: IconName.Reset,
            onClick: (change) => {
              confirmSingleReset(`Are you sure you want to reset your changes to: <b>${change.component.name}</b>`)
                .then(() => {
                  resetComponent(localDiff.baseProject, change.component.name);
                  fetch.fetchLocal();
                })
                .catch(() => {});
            }
          },
          file: {
            icon: IconName.Reset,
            onClick: (change: FileChange) => {
              confirmSingleReset(`Are you sure you want to reset your changes to: <b>${change.path}</b>`)
                .then(async () => {
                  await resetFile(ProjectModel.instance, change, repositoryPath, fetch.currentCommitSha);
                  fetch.fetchLocal();
                })
                .catch(() => {});
            }
          },
          setting: {
            icon: IconName.Reset,
            onClick: (change: ObjectPropertyChange) => {
              confirmSingleReset(
                `Are you sure you want to reset your changes to: <b>${getSettingDisplayName(change.property.name)}</b>`
              )
                .then(() => {
                  ProjectModel.instance.setSetting(change.property.name, change.property.oldValue);
                })
                .catch(() => {});
            }
          },
          textStyle: {
            icon: IconName.Reset,
            onClick: (change) => {
              confirmSingleReset(`Are you sure you want to reset your changes to: <b>${change.property.name}</b>`)
                .then(() => updateStyle('text', change))
                .catch(() => {});
            }
          },
          colorStyle: {
            icon: IconName.Reset,
            onClick: (change) => {
              confirmSingleReset(`Are you sure you want to reset your changes to: <b>${change.property.name}</b>`)
                .then(() => updateStyle('colors', change))
                .catch(() => {});
            }
          },
          cloudservice: {
            icon: IconName.Reset,
            onClick: (change) => {
              confirmSingleReset(`Are you sure you want to reset your changes to the active cloud services?`)
                .then(() => {
                  const cloudservices = change.property.oldValue || {
                    instanceId: undefined,
                    endpoint: undefined,
                    appId: undefined
                  };

                  ProjectModel.instance.setMetaData('cloudservices', cloudservices);
                  ProjectModel.instance.notifyListeners('cloudServicesChanged');
                })
                .catch(() => {});
            }
          }
        }}
      />
    </>
  );
}

function updateStyle(styleType, change: ObjectPropertyChange) {
  const stylesModel = new StylesModel();
  console.log(styleType, change);
  if (!change.property.oldValue) {
    stylesModel.deleteStyle(styleType, change.property.name);
  } else {
    stylesModel.setStyle(styleType, change.property.name, change.property.oldValue);
  }
  stylesModel.dispose();
}

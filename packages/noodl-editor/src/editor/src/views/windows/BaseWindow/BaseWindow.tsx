import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import { platform } from '@noodl/platform';

import { App } from '@noodl-models/app';
import { ProjectModel } from '@noodl-models/projectmodel';

import { TitleBar, TitleBarVariant, TitleBarState } from '@noodl-core-ui/components/app/TitleBar';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';

export enum BaseWindowVariant {
  Default = 'default',
  Shallow = 'shallow'
}

export interface BaseWindowProps {
  title?: string;
  variant?: BaseWindowVariant;

  children: React.ReactNode;
}

export function BaseWindow({
  title = ProjectModel.instance.name,
  variant = BaseWindowVariant.Default,
  children
}: BaseWindowProps) {
  const [newVersionAvailable, setNewVersionAvailable] = useState<boolean>(undefined);

  const [AutoUpdateDialog, autoUpdateConfirmation] = useConfirmationDialog({
    title: 'New auto update available',
    message: 'A new version has been downloaded. Restart the application to apply the updates.',
    confirmButtonLabel: 'Restart',
    cancelButtonLabel: 'Later'
  });

  useEffect(() => {
    const func = () => setNewVersionAvailable(true);

    ipcRenderer.on('showAutoUpdatePopup', func);
    return function () {
      ipcRenderer.off('showAutoUpdatePopup', func);
    };
  }, []);

  function onNewVersionAvailableClicked() {
    autoUpdateConfirmation()
      .then(() => {
        ipcRenderer.send('autoUpdatePopupClosed', true);
      })
      .catch(() => {
        ipcRenderer.send('autoUpdatePopupClosed', false);
      });
  }

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      <AutoUpdateDialog />

      <VStack UNSAFE_style={{ height: '100%' }}>
        <TitleBar
          title={title}
          variant={variant === BaseWindowVariant.Shallow ? TitleBarVariant.Shallow : TitleBarVariant.Default}
          version={platform.getVersionWithTag()}
          state={newVersionAvailable ? TitleBarState.UpdateAvailable : TitleBarState.Default}
          isWindows={['win32', 'linux'].includes(process.platform)}
          onMinimizeClicked={() => App.instance.minimize()}
          onMaximizeClicked={() => App.instance.maximize()}
          onCloseClicked={() => App.instance.close()}
          onNewVersionAvailableClicked={onNewVersionAvailableClicked}
        />

        {children}
      </VStack>
    </div>
  );
}

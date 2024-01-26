import React, { RefObject } from 'react';

import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';
import { BaseDialog } from '@noodl-core-ui/components/layout/BaseDialog';
import { Tabs } from '@noodl-core-ui/components/layout/Tabs';
import { PopupSection } from '@noodl-core-ui/components/popups/PopupSection';

import { DeployContextProvider, useDeployContext } from './DeployPopup.context';
import { DeployToFolderTab } from './tabs/DeployToFolderTab';

function DeployPopupChild() {
  const { hasActivity } = useDeployContext();

  return (
    <div style={{ width: 400 }}>
      <div
        style={{
          backgroundColor: '#444444',
          position: 'relative',
          maxHeight: `calc(90vh - 40px)`,
          // @ts-expect-error https://github.com/frenic/csstype/issues/62
          overflowY: 'overlay',
          overflowX: 'hidden'
        }}
      >
        <PopupSection title="Deploy options" />

        <Tabs tabs={[{ label: 'Self Hosting', content: <DeployToFolderTab />, testId: 'self-hosting-tab-button' }]} />

        {hasActivity && <ActivityIndicator isOverlay />}
      </div>
    </div>
  );
}

export interface DeployPopupProps {
  triggerRef: RefObject<HTMLElement>;
  isVisible: boolean;
  onClose: () => void;
}

export function DeployPopup(props: DeployPopupProps) {
  return (
    <DeployContextProvider>
      <BaseDialog
        triggerRef={props.triggerRef}
        isVisible={props.isVisible}
        onClose={props.onClose}
        hasArrow
        isLockingScroll
      >
        <DeployPopupChild />
      </BaseDialog>
    </DeployContextProvider>
  );
}

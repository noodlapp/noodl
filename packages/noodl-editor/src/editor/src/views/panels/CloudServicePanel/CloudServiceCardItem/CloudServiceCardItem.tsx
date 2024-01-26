import React from 'react';

import { CloudService, Environment } from '@noodl-models/CloudServices';

import { ToastType } from '../../../ToastLayer/components/ToastCard';
import { CloudServiceCard } from '../CloudServiceCard';
import { useCloudServiceContext } from '../CloudServicePanel.context';

export interface CloudServiceCardItemProps {
  environment: Environment;
  deleteEnvironment: () => Promise<void>;
}

export function CloudServiceCardItem({ environment, deleteEnvironment }: CloudServiceCardItemProps) {
  const { hasUpdatedEditorEnvironment, editorEnvironmentId, setSelectedEnvironment, runActivity } =
    useCloudServiceContext();

  const isSelected = environment.id === editorEnvironmentId;

  async function onDelete() {
    await deleteEnvironment();
    await runActivity('Deleting cloud service...', async () => {
      const response: boolean = await CloudService.instance.backend.delete(environment.id);
      return {
        type: ToastType.Success,
        message: 'Cloud service deleted'
      };
    });
  }

  async function onArchive() {
    throw new Error('Method not implemented.');
  }

  async function onRestore() {
    throw new Error('Method not implemented.');
  }

  return (
    <CloudServiceCard
      isAlwaysOpen={isSelected}
      key={environment.id}
      environment={environment}
      isEditorEnvironment={isSelected}
      isAlerting={isSelected && hasUpdatedEditorEnvironment}
      onDeleteClick={onDelete}
      onArchiveClick={onArchive}
      onRestoreClick={onRestore}
      onSetEditorClick={setSelectedEnvironment}
      onUnsetEditorClick={() => setSelectedEnvironment(null)}
    />
  );
}

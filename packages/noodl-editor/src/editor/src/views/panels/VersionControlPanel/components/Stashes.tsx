import React from 'react';
import { Stash } from '@noodl/git/src/core/models/snapshot';
import { GitResetMode, reset } from '@noodl/git/src/core/reset';
import { dropStashEntry, popStashEntry } from '@noodl/git/src/core/stash';

import { ProjectModel } from '@noodl-models/projectmodel';

import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';
import { Section, SectionVariant } from '@noodl-core-ui/components/sidebar/Section';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';
import { useVersionControlContext } from '../context';
import GitStashCard from './GitStashCard';

export function Stashes() {
  const { fetch, repositoryPath, localChangesCount } = useVersionControlContext();

  const stashes = fetch.stashes;

  const [ApplyStashDialog, confirmApplyStash] = useConfirmationDialog({
    title: 'Confirm Stash',
    message: 'Do you want to apply this stash?',
    confirmButtonLabel: 'Yes, apply',
    isDangerousAction: true
  });

  const [DeleteStashDialog, confirmDeleteStash] = useConfirmationDialog({
    title: 'Confirm Stash',
    message: 'Do you want to delete this stash?',
    confirmButtonLabel: 'Yes, delete',
    isDangerousAction: true
  });

  const [CantCreateStashDialog, showCantCreateStashDialog] = useConfirmationDialog({
    isCancelButtonHidden: true,
    title: "Can't do that yet",
    message: "Can't apply stash with local changes. Commit your changes before applying.",
    confirmButtonLabel: 'OK',
    isDangerousAction: true
  });

  async function applyStash(stash: Stash) {
    if (localChangesCount > 0) {
      showCantCreateStashDialog();
      return;
    }

    confirmApplyStash()
      .then(async () => {
        ProjectModel.setSaveOnModelChange(false);

        //localChangesCount is zero but we might have some minor metadata changes, reset them before applying stash
        await reset(repositoryPath, GitResetMode.Hard, 'HEAD');

        try {
          await popStashEntry(repositoryPath, stash.name);
          EventDispatcher.instance.notifyListeners('projectChangedOnDisk'); //note: automatically enables project saving again when the project has been reloaded
          await fetch.fetchLocal();
          ToastLayer.showSuccess('Stash applied');
        } catch (e) {
          ToastLayer.showError(e.toString());
        }

        ProjectModel.setSaveOnModelChange(true);
      })
      .catch((_) => {});
  }

  async function deleteStash(stash: Stash) {
    confirmDeleteStash()
      .then(async () => {
        try {
          await dropStashEntry(repositoryPath, stash.name);
          fetch.fetchLocal();
          ToastLayer.showSuccess('Stash deleted');
        } catch (e) {
          ToastLayer.showError(e.toString());
        }
      })
      .catch((_) => {
        /* user canceled */
      });
  }

  if (stashes.length === 0) {
    return null;
  }

  return (
    <Section title="Stashes" variant={SectionVariant.Panel} UNSAFE_style={{ flexGrow: 1 }}>
      <CantCreateStashDialog />
      <ApplyStashDialog />
      <DeleteStashDialog />

      {stashes.map((stash) => (
        <GitStashCard
          key={stash.sha}
          stash={stash}
          onApplyClick={() => applyStash(stash)}
          onDeleteClick={() => deleteStash(stash)}
        />
      ))}
    </Section>
  );
}

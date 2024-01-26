import React, { useEffect, useRef, useState } from 'react';
import { deleteLocalBranch, deleteRemoteBranch, GitActionError } from '@noodl/git';
import { checkoutBranch } from '@noodl/git/src/core/checkout';
import { Branch, BranchType } from '@noodl/git/src/core/models/branch';
import { GitResetMode, reset } from '@noodl/git/src/core/reset';

import { ProjectModel } from '@noodl-models/projectmodel';
import { copyValueToClipboard } from '@noodl-utils/copyValueToClipboard';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton } from '@noodl-core-ui/components/inputs/IconButton';
import { PrimaryButton, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextInput } from '@noodl-core-ui/components/inputs/TextInput';
import { BaseDialog } from '@noodl-core-ui/components/layout/BaseDialog';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { ListItemVariant } from '@noodl-core-ui/components/layout/ListItem';
import { ListItemMenu, ListItemMenuProps } from '@noodl-core-ui/components/layout/ListItemMenu';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { useConfirmationDialog } from '@noodl-core-ui/components/popups/ConfirmationDialog/ConfirmationDialog.hooks';
import { Section } from '@noodl-core-ui/components/sidebar/Section';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { Text, TextSize, TextType } from '@noodl-core-ui/components/typography/Text';

import { EventDispatcher } from '../../../../../../shared/utils/EventDispatcher';
import { ToastLayer } from '../../../ToastLayer/ToastLayer';
import { PROTECTED_BRANCHES } from '../constants';
import { useVersionControlContext } from '../context';

interface BranchListProps {
  onBranchCheckout: () => void;
  onBranchCreated: () => void;
}

export function BranchList({ onBranchCheckout, onBranchCreated }: BranchListProps) {
  const { repositoryPath, fetch, localChangesCount } = useVersionControlContext();
  const { branches, currentBranch } = fetch;

  const [otherBranches, setOtherBranches] = useState<readonly Branch[]>([]);

  const [HaveLocalChangesDialog, showHaveLocalChangesDialog] = useConfirmationDialog({
    title: 'Switch branch',
    message: 'You have local changes. Please commit your changes or stash them before you switch branches.',
    confirmButtonLabel: 'OK',
    isCancelButtonHidden: true
  });

  useEffect(() => {
    if (!branches) {
      return;
    }

    setOtherBranches(branches.filter((x) => x.name !== currentBranch?.name));
  }, [branches, currentBranch]);

  async function onBranchClick(branch: Branch) {
    if (localChangesCount > 0) {
      showHaveLocalChangesDialog();
      return;
    }

    onBranchCheckout();

    ProjectModel.setSaveOnModelChange(false);

    try {
      //localChangesCount is zero but we might have some minor metadata changes, reset them before switching branch
      await reset(repositoryPath, GitResetMode.Hard, 'HEAD');

      await checkoutBranch(repositoryPath, branch, {
        force: false,
        commitish: undefined
      });

      EventDispatcher.instance.notifyListeners('projectChangedOnDisk');
      ToastLayer.showSuccess(`Checked out ${branch.nameWithoutRemote} branch.`);
      await fetch.fetchLocal();
    } catch (error) {
      console.error(error);
      ToastLayer.showError('Failed to checkout branch. Error: ' + error.toString());
    }

    ProjectModel.setSaveOnModelChange(true);
  }

  return (
    <Section
      title="Other branches"
      actions={<CreateBranchButton onBranchCreated={onBranchCreated} />}
      hasBottomSpacing
      UNSAFE_style={{ backgroundColor: 'var(--theme-color-bg-3)' }}
      // UNSAFE_style={{ backgroundColor: 'transparent', width: '320px' }}
    >
      <HaveLocalChangesDialog />
      {otherBranches.length === 0 ? (
        <Box hasLeftSpacing>
          <Label hasTopSpacing hasBottomSpacing variant={TextType.Secondary}>
            No other branches
          </Label>
        </Box>
      ) : (
        otherBranches.map((x) => <BranchListItem key={x.name} branch={x} onClick={() => onBranchClick(x)} />)
      )}
    </Section>
  );
}

interface BranchListItemProps {
  branch: Branch;
  onClick: (branch: Branch) => void;
}

function BranchListItem({ branch, onClick }: BranchListItemProps) {
  const { repositoryPath, fetch, setBranchStatus } = useVersionControlContext();

  const [DeleteDialog, conformDelete] = useConfirmationDialog({
    title: 'Confirm Delete branch',
    message: `Are you sure you want to delete ${branch.nameWithoutRemote} branch? This action cannot be undone.`,
    confirmButtonLabel: 'Yes, delete'
  });

  function onDelete() {
    conformDelete()
      .then(async () => {
        // TODO: Add a different confirmation dialog for deleting branch.
        //       Looking at GitHub Desktop, they have a checkbox for deleting remote branch.
        //       In case you want to keep the branch around, but not locally.

        try {
          // Delete the local branch
          if (branch.type === BranchType.Local) {
            await deleteLocalBranch(repositoryPath, branch);
          }

          // Delete the remote branch
          if (branch.upstream) {
            await deleteRemoteBranch(repositoryPath, branch);
          }

          ToastLayer.showSuccess(`Successfully deleted ${branch.nameWithoutRemote} branch.`);
        } catch (error) {
          if (error instanceof GitActionError) {
            ToastLayer.showError(error.message);
          } else {
            console.error(error);
            ToastLayer.showError('Failed to delete branch. Error: ' + error);
          }
        }

        // Fetch all the changes
        if (branch.upstream) {
          await fetch.fetchRemote();
        } else {
          await fetch.fetchLocal();
        }
      })
      .catch(() => {
        // Cancelled
      });
  }

  let menuItems: ListItemMenuProps['menuItems'] = [];
  if (branch.type !== BranchType.Remote) {
    menuItems = [
      {
        label: 'Copy branch name',
        onClick: () =>
          copyValueToClipboard({
            value: branch.nameWithoutRemote
          })
      },
      'divider',
      {
        label: `Merge into ${fetch.currentBranch?.nameWithoutRemote}...`,
        onClick: () =>
          setBranchStatus({
            kind: 'merge',
            to: branch
          })
      }
    ];

    // Add delete to branches that can be deleted
    if (!PROTECTED_BRANCHES.includes(branch.nameWithoutRemote)) {
      menuItems.push('divider');
      menuItems.push({
        label: 'Delete',
        onClick: onDelete
      });
    }
  }

  return (
    <>
      <DeleteDialog />
      <ListItemMenu
        text={branch.nameWithoutRemote}
        variant={branch.type === BranchType.Remote ? ListItemVariant.HighlightedShy : ListItemVariant.Highlighted}
        icon={IconName.StructureCircle}
        gutter={3}
        menuIcon={IconName.ImportDown}
        menuItems={menuItems}
        onClick={() => onClick(branch)}
      >
        {Boolean(branch.isLocal) && (
          <Box hasLeftSpacing={1}>
            <Text textType={TextType.Shy} size={TextSize.Small} isSpan>
              (local only)
            </Text>
          </Box>
        )}
      </ListItemMenu>
    </>
  );
}

interface CreateBranchButtonProps {
  onBranchCreated: () => void;
}

function CreateBranchButton({ onBranchCreated }: CreateBranchButtonProps) {
  const { git, fetch } = useVersionControlContext();

  const addButtonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [branchName, setBranchName] = useState('');

  async function onCreate() {
    try {
      // Create the new branch
      // TODO: Setup expect error for git, status: 128. Invalid characters.
      await git.createAndCheckoutBranch(branchName);

      ToastLayer.showSuccess(`Created and checked out branch ${branchName}`);
      onBranchCreated();
    } catch (error) {
      if (error instanceof GitActionError) {
        ToastLayer.showError(error.message);
      } else {
        console.error(error);
        ToastLayer.showError('Failed to create branch. Error: ' + error);
      }
    }

    // Close the panel
    setOpen(false);
    setBranchName('');

    // Tell git to fetch the new local status
    fetch.fetchLocal();
  }

  function onCancel() {
    setBranchName('');
    setOpen(false);
  }

  return (
    <>
      <div ref={addButtonRef}>
        <IconButton size={IconSize.Small} icon={IconName.Plus} onClick={() => setOpen(true)} />
      </div>
      <BaseDialog
        isVisible={open}
        triggerRef={addButtonRef}
        hasArrow
        isLockingScroll
        onClose={() => setOpen(false)}
        UNSAFE_style={{ width: '350px' }}
      >
        <Box hasXSpacing hasYSpacing>
          <TextInput
            label="Name"
            value={branchName}
            onChange={(ev) => setBranchName(ev.target.value.replace(/ /g, '-'))}
            hasBottomSpacing
            isAutoFocus
          />
          <Box hasBottomSpacing>
            <Text>
              Create a new branch based on the current{' '}
              <Text textType={TextType.Proud} isSpan>
                {fetch.currentBranch?.nameWithoutRemote}
              </Text>{' '}
              branch.
            </Text>
          </Box>
          <HStack>
            <PrimaryButton label="Create branch" isGrowing hasRightSpacing onClick={onCreate} />
            <PrimaryButton label="Cancel" variant={PrimaryButtonVariant.Muted} isGrowing onClick={onCancel} />
          </HStack>
        </Box>
      </BaseDialog>
    </>
  );
}

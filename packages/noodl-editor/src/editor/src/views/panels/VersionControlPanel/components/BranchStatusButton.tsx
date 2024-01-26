import React, { useEffect, useState } from 'react';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { ActionButton, ActionButtonProps, ActionButtonVariant } from '@noodl-core-ui/components/inputs/ActionButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import { Container } from '@noodl-core-ui/components/layout/Container';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';

import { useVersionControlContext } from '../context';
import { BranchList } from './BranchList';

export function BranchStatusButton() {
  const { branchStatus, setBranchStatus, fetch } = useVersionControlContext();
  const { currentBranch } = fetch;

  const [isBranchesOpen, setIsBranchesOpen] = useState(false);

  useEffect(() => {
    if (branchStatus?.kind === 'merge') {
      setIsBranchesOpen(false);
    }
  }, [branchStatus?.kind]);

  const props = (function (): ActionButtonProps {
    if (!currentBranch) {
      return {
        icon: IconName.StructureCircle,
        variant: ActionButtonVariant.BackgroundAction,
        prefixText: 'Active branch',
        label: '',
        isDisabled: true
      };
    }

    if (!branchStatus || typeof branchStatus === 'string') {
      return {
        icon: IconName.StructureCircle,
        prefixText: 'Active branch',
        label: currentBranch?.name,
        affixIcon: isBranchesOpen ? IconName.CaretUp : IconName.CaretDown
      };
    }

    switch (branchStatus.kind) {
      case 'merge': {
        return {
          icon: IconName.ArrowLeft,
          variant: ActionButtonVariant.Proud,
          prefixText: 'Merging',
          label: (
            <Container>
              <Text textType={TextType.Proud}>{currentBranch.name}</Text>
              <Box hasXSpacing={1}>
                <Text textType={TextType.Default}>with</Text>
              </Box>
              <Text textType={TextType.Proud}>{branchStatus.to.nameWithoutRemote}</Text>
            </Container>
          )
        };
      }
    }
  })();

  function onClick() {
    if (props.isDisabled) return;

    setBranchStatus(null);
    setIsBranchesOpen(!isBranchesOpen);
  }

  return (
    <div style={{ position: 'relative' }}>
      <ActionButton
        {...props}
        variant={isBranchesOpen ? ActionButtonVariant.Proud : props.variant || ActionButtonVariant.Default}
        onClick={onClick}
      />

      <div
        style={{
          position: 'absolute',
          width: '100%',
          zIndex: 1,
          boxShadow: '0 10px 10px 0px var(--theme-color-bg-1-transparent-2)',
          maxHeight: '50vh',
          overflow: 'hidden overlay'
        }}
      >
        <Collapsible isCollapsed={!isBranchesOpen} transitionMs={200}>
          <BranchList
            onBranchCheckout={() => setIsBranchesOpen(false)}
            onBranchCreated={() => setIsBranchesOpen(false)}
          />
        </Collapsible>
      </div>
    </div>
  );
}

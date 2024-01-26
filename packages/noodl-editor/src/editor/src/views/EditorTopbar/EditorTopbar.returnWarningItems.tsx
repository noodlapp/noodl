import React from 'react';

import { NodeType } from '@noodl-constants/NodeType';
import { ComponentModel } from '@noodl-models/componentmodel';
import { isComponentModel_CloudRuntime } from '@noodl-utils/NodeGraph';

import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Container } from '@noodl-core-ui/components/layout/Container';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { MenuDialogItem } from '@noodl-core-ui/components/popups/MenuDialog';
import { insertDividerBetweenAllItems } from '@noodl-core-ui/components/popups/MenuDialog/MenuDialog.utils';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { Text } from '@noodl-core-ui/components/typography/Text';

import { NodeGraphEditor } from '../nodegrapheditor';

interface WarningItem {
  ref: {
    node?: TSFixme;
    component?: ComponentModel;
    connection: {
      fromId: string;
      fromProperty: string;
      toId: string;
      toProperty: string;
    };
    key: string;
  };
  warning: {
    level: 'error' | 'warning';
    message: string;
    showGlobally: boolean;
    type?: string;
    onDismiss?: () => void;
    onUseTheirs?: () => void;
    conflictMetadata?: {
      parameter: string;
      ours: string;
      theirs: string;
    };
  };
}

function getStyleFromNodeType(nodeType) {
  const type: NodeType = nodeType?.color;
  let colorName = '';

  switch (type) {
    case NodeType.Visual:
      colorName = 'blue';
      break;
    case NodeType.Logic:
      colorName = 'grey';
      break;
    case NodeType.Data:
      colorName = 'green';
      break;
    case NodeType.Connection:
      colorName = 'purple';
      break;
    case NodeType.Custom:
      colorName = 'pink';
      break;
    default:
      colorName = 'grey';
  }

  return {
    backgroundColor: `var(--base-color-node-${colorName}-500)`,
    color: `var(--base-color-node-${colorName}-100)`,
    display: 'inline-block',
    padding: 2,
    borderRadius: 2
  };
}

function partitionArray<T>(array: T[], conditionFunc: (item: T) => boolean): [T[], T[]] {
  return array.reduce(
    ([pass, fail], elem) => {
      return conditionFunc(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
    },
    [[], []]
  );
}

function isMergeConflictWarning(warning: WarningItem) {
  return warning?.warning?.type === 'conflict-source-code' || warning?.warning?.type === 'conflict';
}

export function returnWarningItems(warnings: WarningItem[], nodeGraphContext: NodeGraphEditor): MenuDialogItem[] {
  if (!warnings.length) return [];

  const existingWarnings = warnings.filter((warning) => Boolean(warning.ref.component));

  if (!existingWarnings.length) return [];

  //put all the merge warnings at the top
  const [mergeConflictWarnings, otherWarnings] = partitionArray(existingWarnings, isMergeConflictWarning);

  const sortedWarnings = mergeConflictWarnings.concat(otherWarnings);

  return insertDividerBetweenAllItems(
    sortedWarnings.map((warning) => {
      function endSlot() {
        const componentName = warning.ref.component?.name.replace('/#__cloud__', '');
        const isCloudComponent = isComponentModel_CloudRuntime(warning.ref.component);

        if (isMergeConflictWarning(warning)) {
          return (
            <VStack>
              <Text hasBottomSpacing>
                At node{' '}
                <Label isInline UNSAFE_style={getStyleFromNodeType(warning.ref.node.type)}>
                  {warning.ref.node.label}
                </Label>{' '}
                in {isCloudComponent && 'cloud function '}component {componentName}
              </Text>
              <MergeConflict warning={warning} />
            </VStack>
          );
        } else if (warning?.ref?.node) {
          return (
            <Text>
              At node{' '}
              <Label isInline UNSAFE_style={getStyleFromNodeType(warning.ref.node.type)}>
                {warning.ref.node.label}
              </Label>{' '}
              in {isCloudComponent && 'cloud function '}component {componentName}
            </Text>
          );
        } else if (warning?.ref?.component) {
          const sourceNode = warning.ref.component.graph.findNodeWithId(warning.ref.connection.fromId);
          const targetNode = warning.ref.component.graph.findNodeWithId(warning.ref.connection.toId);
          const sourcePort = sourceNode?.getPort(warning.ref.connection.fromProperty);
          const targetPort = targetNode?.getPort(warning.ref.connection.toProperty);

          return (
            <Text>
              At connection between{' '}
              <Label isInline UNSAFE_style={getStyleFromNodeType(sourceNode?.type)}>
                {' '}
                {sourceNode?.label || 'undefined'} ({sourcePort?.displayName || 'unknown'})
              </Label>{' '}
              and{' '}
              <Label isInline UNSAFE_style={getStyleFromNodeType(targetNode?.type)}>
                {targetNode?.label || 'undefined'} ({targetPort?.displayName || 'unknown'})
              </Label>{' '}
              in {isCloudComponent && 'cloud function '}component {componentName}
            </Text>
          );
        }
      }

      const message = warning.warning.message;
      let label = '';

      if (typeof message === 'string') {
        label = message.replace('<br>', ' - ');
      } else if (message && typeof message === 'object') {
        label = JSON.stringify(message);
      }

      return {
        icon: IconName.WarningTriangle,
        label: <span dangerouslySetInnerHTML={{ __html: label }} />,
        key:
          // long key, just to be sure
          warning.ref.component?.id +
          warning.warning.message +
          warning?.ref?.connection?.fromProperty +
          warning?.ref?.connection?.toProperty +
          warning?.ref?.node?.id,
        isDangerous: true,
        endSlot: endSlot(),
        onClick: () =>
          nodeGraphContext.switchToComponent(warning.ref.component, {
            node: warning?.ref?.node || undefined,
            pushHistory: true
          })
      };
    })
  );
}

const ourTheirsStyle = {
  backgroundColor: `var(--theme-color-bg-3)`,
  color: `var(--theme-color-fg-default)`,
  display: 'inline-block',
  padding: 2,
  borderRadius: 2,
  marginBottom: 4
};

function formatMergeConflictParamter(param) {
  return param && (typeof param === 'object' || Array.isArray(param)) ? JSON.stringify(param, null, 2) : param;
}

function MergeConflict({ warning }: { warning: WarningItem }) {
  const ours = warning.warning.conflictMetadata?.ours;
  const theirs = warning.warning.conflictMetadata?.theirs;

  return (
    <VStack>
      {warning.warning.type !== 'conflict-source-code' && (
        <>
          <Text>
            <Label isInline UNSAFE_style={ourTheirsStyle}>
              Ours
            </Label>
            {'  '}
            <Label isInline>{formatMergeConflictParamter(ours)}</Label>
          </Text>
          <Text>
            <Label isInline UNSAFE_style={ourTheirsStyle}>
              Theirs
            </Label>{' '}
            <Label isInline>{formatMergeConflictParamter(theirs)}</Label>
          </Text>
        </>
      )}

      <Container hasTopSpacing>
        <PrimaryButton
          label={warning.warning.type === 'conflict-source-code' ? 'Mark resolved' : 'Use mine'}
          size={PrimaryButtonSize.Small}
          hasRightSpacing
          onClick={() => warning.warning?.onDismiss()}
        />
        <PrimaryButton
          label="Use theirs"
          size={PrimaryButtonSize.Small}
          variant={PrimaryButtonVariant.Muted}
          onClick={() => warning.warning?.onUseTheirs()}
        />
      </Container>
    </VStack>
  );
}

import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import { Keybindings } from '@noodl-constants/Keybindings';
import { Environment } from '@noodl-models/CloudServices';
import ParseDashboardServer from '@noodl-utils/parsedashboardserver';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonState, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { DialogRenderDirection } from '@noodl-core-ui/components/layout/BaseDialog';
import { Collapsible } from '@noodl-core-ui/components/layout/Collapsible';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label, LabelSpacingSize } from '@noodl-core-ui/components/typography/Label';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';

import { CloudServiceModal } from '../CloudServiceModal/CloudSerivceModal';
import css from './CloudServiceCard.module.scss';

export interface CloudServiceCardProps {
  environment: Environment;

  /** True, if currently active environment */
  isEditorEnvironment?: boolean;
  isAlerting?: boolean;
  isAlwaysOpen?: boolean;

  onDeleteClick?: () => void;
  onArchiveClick?: () => void;
  onRestoreClick?: () => void;
  onSetEditorClick?: (id: Environment['id']) => void;
  onUnsetEditorClick?: () => void;
}

export function CloudServiceCard({
  environment,

  isEditorEnvironment,
  isAlerting,
  isAlwaysOpen,

  onDeleteClick,
  onArchiveClick,
  onRestoreClick,
  onSetEditorClick,
  onUnsetEditorClick
}: CloudServiceCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  let isDrawerCollapsed = !isDrawerOpen;
  if (isAlwaysOpen) isDrawerCollapsed = false;

  function onDashboardClicked() {
    // Open Parse Dashboard
    ParseDashboardServer.instance.openInWindow(environment);
  }

  const { name, description } = environment;

  useEffect(() => {
    if (!rootRef?.current || !isAlerting) return;
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [rootRef?.current, isAlerting]);

  let errorMessage = '';
  if (!environment.masterKey) {
    errorMessage = 'Missing Master Key';
  }

  return (
    <div
      ref={rootRef}
      className={classNames([
        css['Root'],
        isEditorEnvironment && css['is-editor-environment'],
        !isDrawerCollapsed && css['is-open'],
        isAlerting && css['is-alerting']
      ])}
      data-test={`cloud-service-card-${name}`}
    >
      <div
        className={classNames(css['Inner'], isAlwaysOpen && css['is-always-open'])}
        onClick={() => !isAlwaysOpen && setIsDrawerOpen(!isDrawerOpen)}
      >
        <div className={css['MetaBar']}>
          <div className={classNames([css['TypeDisplay'], isEditorEnvironment && css['is-editor-environment']])}>
            <Icon icon={IconName.CloudCheck} size={IconSize.Small} UNSAFE_style={{ marginRight: 4 }} />
            {'Self hosted '}
            {errorMessage && <span className={css['ArchivedDisplay']}>({errorMessage})</span>}
            {isEditorEnvironment && <span className={css['UsedInEditorDisplay']}>(Used in editor)</span>}
          </div>

          <div className={css['ToggleContainer']}>
            {!isAlwaysOpen && (
              <IconButton
                icon={IconName.CaretDown}
                variant={IconButtonVariant.Transparent}
                state={isDrawerOpen ? IconButtonState.Rotated : null}
              />
            )}
          </div>
        </div>

        <div className={css['Header']} data-test="open-cloud-service-card-drawer">
          <div className={css['HeaderInner']}>
            <Label
              variant={TextType.DefaultContrast}
              hasBottomSpacing={
                // sorry for double ternary, but essentially:
                // SMALL if has description
                // LARGE if no description and isAlwaysOpen
                description ? LabelSpacingSize.Small : isAlwaysOpen ? LabelSpacingSize.Large : undefined
              }
            >
              {name}
            </Label>

            {description && <Text hasBottomSpacing={isEditorEnvironment}>{description}</Text>}
          </div>

          {isEditorEnvironment && (
            <Tooltip
              content="Open the Parse Dashboard"
              fineType={[
                `In Window: ${Keybindings.CLOUD_SERVICE_OPEN_DASHBOARD.label}`,
                `In Browser: ${Keybindings.CLOUD_SERVICE_OPEN_DASHBOARD_BROWSER.label}`
              ]}
              renderDirection={DialogRenderDirection.Below}
            >
              <PrimaryButton
                label="Open dashboard"
                size={PrimaryButtonSize.Small}
                onClick={onDashboardClicked}
                isGrowing
              />
            </Tooltip>
          )}
        </div>
      </div>

      <Collapsible isCollapsed={isDrawerCollapsed}>
        <div className={classNames(css['Drawer'], isEditorEnvironment && css['has-no-top-padding'])}>
          {!isEditorEnvironment && (
            <>
              <PrimaryButton
                label="Open dashboard"
                size={PrimaryButtonSize.Small}
                onClick={onDashboardClicked}
                isGrowing
                hasBottomSpacing
              />
            </>
          )}

          <PrimaryButton
            variant={PrimaryButtonVariant.MutedOnLowBg}
            label="Manage cloud service"
            size={PrimaryButtonSize.Small}
            onClick={() => setIsModalVisible(true)}
            hasBottomSpacing
          />

          {isEditorEnvironment && (
            <PrimaryButton
              variant={PrimaryButtonVariant.MutedOnLowBg}
              label="Use editor without backend"
              size={PrimaryButtonSize.Small}
              onClick={onUnsetEditorClick}
              hasBottomSpacing={!isEditorEnvironment}
            />
          )}

          {!isEditorEnvironment && (
            <PrimaryButton
              variant={PrimaryButtonVariant.MutedOnLowBg}
              size={PrimaryButtonSize.Small}
              label="Use in editor"
              onClick={() => {
                // A lil' ugly hack to trigger the overlay
                setTimeout(() => {
                  onSetEditorClick(isEditorEnvironment ? null : environment.id);
                }, 10);
              }}
            />
          )}
        </div>
      </Collapsible>

      {isModalVisible && (
        <CloudServiceModal
          isVisible={isModalVisible}
          setIsVisible={setIsModalVisible}
          isActive={isEditorEnvironment}
          environment={environment}
          onDeleteClick={onDeleteClick}
          onArchiveClick={onArchiveClick}
          onRestoreClick={onRestoreClick}
          onSetEditorClick={onSetEditorClick}
          onUnsetEditorClick={onUnsetEditorClick}
        />
      )}
    </div>
  );
}

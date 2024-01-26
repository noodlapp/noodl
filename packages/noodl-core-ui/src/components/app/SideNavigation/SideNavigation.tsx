import classNames from 'classnames';
import React, { useRef, useState } from 'react';

import {
  SideNavigationContextProvider,
  useSideNavigationContext
} from '@noodl-core-ui/components/app/SideNavigation/SideNavigation.context';
import { IconName } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonState, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { DialogRenderDirection } from '@noodl-core-ui/components/layout/BaseDialog';
import { MenuDialog, MenuDialogProps } from '@noodl-core-ui/components/popups/MenuDialog';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';
import { Slot } from '@noodl-core-ui/types/global';

import css from './SideNavigation.module.scss';

export interface SideNavigationButtonProps {
  isActive?: boolean;
  icon: IconName;
  label: string;
  fineType?: string;
  notification?: { count: number };
  isDisabled?: boolean;
  testId?: string;
  onClick?: () => void;
  menuItems?: MenuDialogProps['items'];
}

export function SideNavigationButton({
  isActive,
  icon,
  label,
  fineType,
  notification,
  isDisabled,
  testId,
  onClick,
  menuItems
}: SideNavigationButtonProps) {
  const context = useSideNavigationContext();
  const iconRef = useRef();
  const hasMenu = Boolean(menuItems);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // NOTE: Commented out extending sidebar labels in case we want to bring them back at some point

  return (
    <div
      className={css['SideNavigationButton']}
      onClick={() => {
        !isDisabled && onClick && onClick();
        //context.setIsShowingTooltips(false);
      }}
      // onMouseEnter={() => context.setIsShowingTooltips(true)}
      // onMouseLeave={() => context.setIsShowingTooltips(false)}
      data-test={testId}
    >
      {hasMenu && (
        <MenuDialog
          items={menuItems}
          onClose={() => setIsMenuVisible(false)}
          triggerRef={iconRef}
          isVisible={isMenuVisible}
        />
      )}

      <div className={css['IconButtonContainer']} ref={iconRef} onClick={() => hasMenu && setIsMenuVisible(true)}>
        <Tooltip
          content={label}
          fineType={fineType}
          renderDirection={DialogRenderDirection.Horizontal}
          showAfterMs={300}
        >
          <IconButton
            variant={IconButtonVariant.Transparent}
            state={isActive ? IconButtonState.Active : IconButtonState.Default}
            icon={icon}
            isDisabled={isDisabled}
          />
        </Tooltip>
        {notification && (
          <div className={css['NotificationBadge']}>{notification.count > 99 ? '99+' : notification.count}</div>
        )}
      </div>

      {/* <div
        className={classNames(css['Label'], context.isShowingTooltips && css['is-tooltip-visible'])}
        onClick={() => hasMenu && setIsMenuVisible(true)}
      >
        <div className={classNames(css['LabelInner'], isActive && css['is-active'])}>
          <Text textType={isActive ? TextType.Proud : TextType.Shy}>{label}</Text>
          {fineType && (
            <Label size={LabelSize.Small} variant={TextType.Shy} UNSAFE_className={css['Command']}>
              {fineType}
            </Label>
          )}
        </div>
      </div> */}
    </div>
  );
}

export interface SideNavigationProps {
  toolbar: Slot;
  panel: Slot;

  onExitClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function SideNavigation({ toolbar, panel, onExitClick }: SideNavigationProps) {
  return (
    <SideNavigationContextProvider>
      <div className={css['Root']}>
        <div className={css['Panel']}>{panel}</div>

        <div className={css['Toolbar']}>
          <div className={css['Logo']}>
            <SideNavigationButton
              icon={IconName.Logo}
              label="Exit project"
              menuItems={[{ label: 'Exit project', isDangerous: true, onClick: onExitClick }]}
            />
          </div>

          {toolbar}
        </div>
      </div>
    </SideNavigationContextProvider>
  );
}

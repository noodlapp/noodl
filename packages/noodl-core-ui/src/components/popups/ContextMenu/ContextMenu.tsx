import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import { IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonSize, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { MenuDialog, MenuDialogProps, MenuDialogWidth } from '@noodl-core-ui/components/popups/MenuDialog';

import css from './ContextMenu.module.scss';

export interface ContextMenuProps {
  menuItems: MenuDialogProps['items'];
  title?: string;
  icon?: IconName;
  variant?: IconButtonVariant;
  size?: IconSize;
  buttonSize?: IconButtonSize;
  menuWidth?: MenuDialogWidth;
  onOpen?: () => void;
  onClose?: () => void;
  renderDirection?: MenuDialogProps['renderDirection'];

  testId?: string;
}

export function ContextMenu({
  menuItems,
  title,
  icon,
  size = IconSize.Tiny,
  buttonSize = IconButtonSize.Default,
  menuWidth,
  onOpen,
  onClose,
  variant,
  testId,
  renderDirection
}: ContextMenuProps) {
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const toggleRef = useRef();

  useEffect(() => {
    if (isContextMenuVisible) {
      onOpen && onOpen();
    } else {
      onClose && onClose();
    }

    // not including onOpen in deps as it
    // should not cause a component rerender
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContextMenuVisible]);

  return (
    <div
      tabIndex={1}
      className={classNames(css['Root'], isContextMenuVisible && css['is-visible'])}
      onFocus={() => setIsContextMenuVisible(true)}
      data-test={testId}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div ref={toggleRef}>
        <IconButton
          icon={icon || IconName.DotsThreeHorizontal}
          onClick={(e) => {
            setIsContextMenuVisible(true);
          }}
          variant={variant}
          size={size}
          buttonSize={buttonSize}
        />
      </div>

      <MenuDialog
        items={menuItems}
        title={title}
        isVisible={isContextMenuVisible}
        onClose={() => setIsContextMenuVisible(false)}
        triggerRef={toggleRef}
        width={menuWidth}
        renderDirection={renderDirection}
      />
    </div>
  );
}

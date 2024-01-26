import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';

import { getComponentIconType } from '@noodl-models/nodelibrary/ComponentIcon';
import { getDefaultComponent } from '@noodl-models/projectmodel.utils';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';

import css from './NodeGraphComponentTrail.module.scss';

export interface ComponentTrailItem {
  id?: string;
  name: string;
  fullName: string;
  component?: TSFixme; // Noodl Component object or undefined if folder
  isCurrent: boolean;
  stateText: 'Read only' | null;
}

export interface NodeGraphComponentTrailProps {
  componentTrail: ComponentTrailItem[];

  canNavigateBack: boolean;
  canNavigateForward: boolean;

  onSwitchToComponent: (component: TSFixme, args?: any) => void;
  onHistoryForward: () => void;
  onHistoryBack: () => void;
}

export function NodeGraphComponentTrail({
  componentTrail,

  canNavigateBack,
  canNavigateForward,

  onSwitchToComponent,
  onHistoryBack,
  onHistoryForward
}: NodeGraphComponentTrailProps) {
  const trailRef = useRef<HTMLDivElement>(null);

  // Change the scroll direction to horizontal.
  function onScroll(event: React.WheelEvent<HTMLDivElement>) {
    if (trailRef.current) {
      event.preventDefault();
      trailRef.current.scrollLeft += event.deltaY + event.deltaX;
    }
  }

  return (
    <div className={css['Root']}>
      <div className={css['HistoryControls']}>
        <IconButton
          icon={IconName.CaretLeft}
          onClick={onHistoryBack}
          size={IconSize.Small}
          variant={IconButtonVariant.OpaqueOnHover}
          isDisabled={!canNavigateBack}
          UNSAFE_className={css['HistoryButton']}
        />
        <IconButton
          icon={IconName.CaretRight}
          onClick={onHistoryForward}
          size={IconSize.Small}
          variant={IconButtonVariant.OpaqueOnHover}
          isDisabled={!canNavigateForward}
          UNSAFE_className={css['HistoryButton']}
        />
      </div>

      <div className={css['TrailContainer']}>
        <div ref={trailRef} className={css['Trail']} onWheel={onScroll}>
          {componentTrail.map((item) => {
            if (item.component)
              return <Item key={item.fullName} item={item} onSwitchToComponent={onSwitchToComponent} />;

            return (
              <Tooltip
                UNSAFE_triggerClassName={css['ItemTrigger']}
                content={'Has no graph'}
                key={item.fullName}
                isNotHiddenOnClick
              >
                <Item item={item} onSwitchToComponent={onSwitchToComponent} />
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ItemProps {
  item: ComponentTrailItem;
  onSwitchToComponent: NodeGraphComponentTrailProps['onSwitchToComponent'];
}

function Item({ item, onSwitchToComponent }: ItemProps) {
  let icon = getIconFromItem(item);
  const itemRef = useRef<HTMLDivElement>();

  // change a visual component icon to be a regular component icon in the trail
  // @ts-expect-error fix this when we refactor the component sidebar to not use the old HTML templates
  if (icon === 2) {
    icon = IconName.Component;
  }

  useEffect(() => {
    if (!itemRef.current || !item.isCurrent) return;

    itemRef.current.scrollIntoView();
  }, [itemRef.current, item.isCurrent]);

  const name = item.name;
  let isSheet = false;

  if (!item.component) {
    if (name.substring(1, -1) === '#') {
      isSheet = true;
    }
  }

  if (name === '#__cloud__') return null;

  const rootComponent = getDefaultComponent();
  let isRootComponent = false;

  if (rootComponent.id) {
    isRootComponent = rootComponent.id === item.id;
  } else {
    isRootComponent = rootComponent.name === item.fullName;
  }

  return (
    <div
      ref={itemRef}
      className={classNames(
        css['Item'],
        item.component ? css['is-component'] : css['is-folder'],
        item.isCurrent && css['is-current']
      )}
      onClick={() => {
        if (!item.component || item.isCurrent) return;
        onSwitchToComponent(item.component, { pushHistory: true });
      }}
    >
      {icon && !isSheet && (
        <Icon icon={isRootComponent ? IconName.Home : icon} size={IconSize.Tiny} UNSAFE_className={css['Icon']} />
      )}
      <Label variant={item.component ? TextType.Default : TextType.Shy} UNSAFE_className={css['Label']}>
        {name}
      </Label>
      {item.component && Boolean(item.stateText) && (
        <Label hasLeftSpacing variant={TextType.Secondary}>
          ({item.stateText})
        </Label>
      )}
    </div>
  );
}

function getIconFromItem(item: TSFixme): IconName {
  if (!item.component) return IconName.FolderClosed;

  const iconType = getComponentIconType(item.component);
  if (iconType) {
    // TODO: Typescript, ugly typings, is there a better way?
    return iconType as unknown as IconName;
  }

  return IconName.Component;
}

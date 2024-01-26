import { useKeyboardCommands } from '@noodl-hooks/useKeyboardCommands';
import { useTriggerRerender } from '@noodl-hooks/useTriggerRerender';
import classNames from 'classnames';
import { ipcRenderer } from 'electron';
import React, { useEffect, useRef, useState } from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';
import { Keybindings } from '@noodl-constants/Keybindings';
import { WarningsModel } from '@noodl-models/warningsmodel';
import { KeyCode, KeyMod } from '@noodl-utils/keyboard/KeyCode';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { IconButton, IconButtonState, IconButtonVariant } from '@noodl-core-ui/components/inputs/IconButton';
import { PrimaryButton } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { ToggleSwitch } from '@noodl-core-ui/components/inputs/ToggleSwitch';
import { MenuDialog, MenuDialogWidth } from '@noodl-core-ui/components/popups/MenuDialog';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label } from '@noodl-core-ui/components/typography/Label';
import { TextType } from '@noodl-core-ui/components/typography/Text';
import { useTrackBounds } from '@noodl-core-ui/hooks/useTrackBounds';

import { EventDispatcher } from '../../../../shared/utils/EventDispatcher';
import { CreateNewNodePanel } from '../createnewnodepanel';
import { DeployPopup } from '../DeployPopup/DeployPopup';
import { TitleBar } from '../documents/EditorDocument/titlebar';
import { NodeGraphEditor } from '../nodegrapheditor';
import PopupLayer from '../popuplayer';
import css from './EditorTopbar.module.scss';
import { returnWarningItems } from './EditorTopbar.returnWarningItems';
import {
  screenSizesWithDividers,
  getScreenSizeObjectFromMeasurements,
  getIconFromScreenSizeGroupName
} from './ScreenSizes';

export interface EditorTopbarProps {
  instance: TitleBar;
  routes: string[];
  onRouteChanged: (value: string) => void;
  setDocumentLayout: (value: 'vertical' | 'horizontal' | 'detachedPreview') => void;
  documentLayout: string;
  zoomFactor: number;
  setZoomFactor: (factor: number) => void;
  onUrlNavigateBack: () => void;
  onUrlNavigateForward: () => void;
  navigationState: { canGoBack: boolean; canGoForward: boolean; route: string };
  onPreviewSizeChanged: (width: number, height: number, deviceName: string) => void;
  previewSize: { width: number; height: number };
  previewMode: boolean;
  onPreviewModeChanged: (previewMode: boolean) => void;
  nodeGraph: NodeGraphEditor;
  deployIsDisabled: boolean;
}

export function EditorTopbar({
  instance,
  routes,
  onRouteChanged,
  setDocumentLayout,
  documentLayout,
  setZoomFactor,
  zoomFactor,
  previewSize,
  onUrlNavigateBack,
  onUrlNavigateForward,
  navigationState,
  onPreviewSizeChanged,
  previewMode,
  onPreviewModeChanged,
  nodeGraph,
  deployIsDisabled
}: EditorTopbarProps) {
  const urlBarRef = useRef<HTMLInputElement>(null);
  const deployButtonRef = useRef();
  const warningButtonRef = useRef();
  const urlInputRef = useRef();
  const zoomLevelTrigger = useRef();
  const screenSizeTrigger = useRef();
  const previewLayoutTrigger = useRef();
  const [isDeployVisible, setIsDeployVisible] = useState(false);
  const [isWarningsDialogVisible, setIsWarningsDialogVisible] = useState(false);
  const [isZoomDialogVisible, setIsZoomDialogVisible] = useState(false);
  const [isSizeDialogVisible, setIsSizeDialogVisible] = useState(false);
  const [isPreviewLayoutDialogVisible, setIsPreviewLayoutDialogVisible] = useState(false);
  const triggerRerender = useTriggerRerender();
  const [isRouteListVisible, setIsRouteListVisible] = useState(false);
  const currentScreenSize = getScreenSizeObjectFromMeasurements(previewSize.width, previewSize.height);
  const [routeTextInputValue, setRouteTextInputValue] = useState('');

  const zoomLevelOptions = [
    {
      label: '100%',
      value: 1
    },
    {
      label: '75%',
      value: 0.75
    },
    {
      label: '50%',
      value: 0.5
    },
    {
      label: '25%',
      value: 0.25
    }
  ];

  if (previewSize.width) {
    zoomLevelOptions.unshift({
      label: 'Fit',
      value: 0
    });
  }

  useEffect(() => {
    setRouteTextInputValue(navigationState.route);
  }, [navigationState?.route]);

  // Warningsmodel does not extend Model, so we get a lot of TS errors.
  // Listening to these events manually to force rerenders
  // TODO: Update WarningsModel
  useEffect(() => {
    const eventGroup = {};
    WarningsModel.instance.on('warningsChanged', () => triggerRerender(), eventGroup);

    return () => {
      WarningsModel.instance.off(eventGroup);
    };
  });

  function showWarnings(e) {
    setIsWarningsDialogVisible(true);
  }

  function onAddClicked(evt: React.MouseEvent<HTMLButtonElement>) {
    evt.stopPropagation();

    const x = Math.round(Math.random() * 100 + 50);
    const y = Math.round(Math.random() * 100 + 50);

    // Put the new node at random position 50-150
    const panAndScale = nodeGraph.getPanAndScale();
    const scaledPos = {
      x: x / panAndScale.scale - panAndScale.x,
      y: y / panAndScale.scale - panAndScale.y
    };

    const createNewNodePanel = new CreateNewNodePanel({
      attachToRoot: true,
      model: nodeGraph.model,
      pos: scaledPos,
      runtimeType: nodeGraph.runtimeType
    });
    createNewNodePanel.render();

    PopupLayer.instance.showPopup({
      content: createNewNodePanel,
      position: 'screen-center',
      isBackgroundDimmed: true,
      onClose: () => createNewNodePanel.dispose()
    });
  }
  const rootRef = useRef<HTMLDivElement>();

  const bounds = useTrackBounds(rootRef);
  const isSmall = bounds?.width < 850;
  const getActiveLayoutIcon = () => {
    switch (documentLayout) {
      case 'vertical':
        return IconName.VerticalSplit;
      case 'horizontal':
        return IconName.HorizontalSplit;
      default:
        return IconName.Cards;
    }
  };

  useKeyboardCommands(() => [
    {
      handler: () => {
        urlBarRef.current?.focus();
      },
      keybinding: KeyMod.CtrlCmd | KeyCode.KEY_L
    }
  ]);

  return (
    <div ref={rootRef} className={classNames(css['Root'], isSmall && css['is-small'])}>
      <div className={css['LeftSide']}>
        <div className={css['is-padded-s']}>
          <Tooltip content="Add node to graph">
            <IconButton
              icon={IconName.Plus}
              iconVariant={FeedbackType.Notice}
              variant={IconButtonVariant.Transparent}
              onClick={onAddClicked}
            />
          </Tooltip>
        </div>

        <div className={css['is-padded']}>
          <Tooltip content="Navigate back">
            <IconButton
              variant={IconButtonVariant.Transparent}
              icon={IconName.CaretLeft}
              onClick={onUrlNavigateBack}
              isDisabled={!navigationState.canGoBack}
            />
          </Tooltip>
          <Tooltip content="Navigate forward">
            <IconButton
              variant={IconButtonVariant.Transparent}
              icon={IconName.CaretRight}
              onClick={onUrlNavigateForward}
              isDisabled={!navigationState.canGoForward}
            />
          </Tooltip>
          <Tooltip content="Refresh preview" fineType={Keybindings.REFRESH_PREVIEW.label}>
            <IconButton
              icon={IconName.Refresh}
              variant={IconButtonVariant.Transparent}
              onClick={() => EventDispatcher.instance.emit('viewer-refresh')}
            />
          </Tooltip>
        </div>

        <MenuDialog
          title="Preview routes"
          width={MenuDialogWidth.Large}
          isVisible={isRouteListVisible}
          onClose={() => setIsRouteListVisible(false)}
          triggerRef={urlInputRef}
          items={routes.map((url) => ({
            label: url,
            isHighlighted: routes.length > 1 && navigationState.route === url,
            onClick: () => onRouteChanged(url)
          }))}
        />

        <div ref={urlInputRef} className={css.UrlBarWrapper}>
          <TextInput
            onRefChange={(ref) => {
              urlBarRef.current = ref.current;
            }}
            value={routeTextInputValue}
            onFocus={() => setIsRouteListVisible(true)}
            onChange={(e) => {
              setRouteTextInputValue(e.target.value);
              setIsRouteListVisible(false);
            }}
            onEnter={() => onRouteChanged(routeTextInputValue)}
            UNSAFE_className={css.UrlBarTextInput}
            variant={TextInputVariant.OpaqueOnHover}
            slotBeforeInput={
              <Icon
                size={IconSize.Small}
                variant={TextType.Default}
                icon={navigationState.route === '/' ? IconName.Home : IconName.File}
                UNSAFE_style={{ marginRight: 8 }}
              />
            }
            slotAfterInput={
              <Icon icon={IconName.CaretDown} variant={TextType.Default} UNSAFE_style={{ marginTop: -2 }} />
            }
          />
        </div>

        <div className={css['is-padded-s']}>
          <Tooltip content="Open dev tools" fineType={Keybindings.OPEN_DEVTOOLS.label}>
            <IconButton
              icon={IconName.Bug}
              variant={IconButtonVariant.Transparent}
              onClick={() => EventDispatcher.instance.emit('viewer-open-devtools')}
            />
          </Tooltip>
        </div>
      </div>

      <div className={css['RightSide']}>
        {instance.warningsAmount > 0 && (
          <div className={css['is-padded']} ref={warningButtonRef}>
            <Tooltip content="Show warnings">
              <IconButton
                id="editortopbar-warning-button"
                variant={IconButtonVariant.Transparent}
                iconVariant={FeedbackType.Danger}
                icon={IconName.WarningTriangle}
                onClick={showWarnings}
                label={String(instance.warningsAmount)}
              />
            </Tooltip>
          </div>
        )}

        <div ref={screenSizeTrigger}>
          <Tooltip content="Preview screen size" UNSAFE_triggerClassName={css.TooltipPositioner}>
            <div
              className={classNames(css['ZoomSelect'], css['TopbarSelect'])}
              onClick={() => setIsSizeDialogVisible(true)}
            >
              <Icon icon={getIconFromScreenSizeGroupName(currentScreenSize.group)} />
              <Icon icon={IconName.CaretDown} />
            </div>
          </Tooltip>

          <MenuDialog
            title="Preview screen size"
            width={MenuDialogWidth.Medium}
            isVisible={isSizeDialogVisible}
            triggerRef={screenSizeTrigger}
            onClose={() => setIsSizeDialogVisible(false)}
            items={screenSizesWithDividers.map((size) => {
              if (typeof size === 'string') return size;

              return {
                label: size.name + (size.width ? ` (${size.width} x ${size.height})` : ''),
                icon: getIconFromScreenSizeGroupName(size.group),
                isHighlighted: size.width === currentScreenSize.width && size.height === currentScreenSize.height,
                onClick: () => onPreviewSizeChanged(size.width, size.height, size.width ? size.name : null)
              };
            })}
          />
        </div>

        <div ref={zoomLevelTrigger}>
          <Tooltip content="Preview zoom level" UNSAFE_triggerClassName={css.TooltipPositioner}>
            <div
              className={classNames(css['ZoomSelect'], css['TopbarSelect'])}
              onClick={() => setIsZoomDialogVisible(true)}
            >
              <Label>{zoomLevelOptions.find((option) => option.value === zoomFactor)?.label}</Label>
              <Icon icon={IconName.CaretDown} />
            </div>
          </Tooltip>

          <MenuDialog
            title="Preview zoom level"
            width={MenuDialogWidth.Small}
            isVisible={isZoomDialogVisible}
            onClose={() => setIsZoomDialogVisible(false)}
            triggerRef={zoomLevelTrigger}
            items={zoomLevelOptions.map((level) => ({
              label: level.label,
              isHighlighted: zoomFactor === level.value,
              onClick: () => setZoomFactor(level.value)
            }))}
          />
        </div>

        {isSmall && (
          <div ref={previewLayoutTrigger}>
            <Tooltip content="Preview layout" UNSAFE_triggerClassName={css.TooltipPositioner}>
              <div
                className={classNames(css['ZoomSelect'], css['TopbarSelect'])}
                onClick={() => setIsPreviewLayoutDialogVisible(true)}
              >
                <Icon icon={getActiveLayoutIcon()} />
                <Icon icon={IconName.CaretDown} />
              </div>
            </Tooltip>

            <MenuDialog
              title="Preview layout"
              width={MenuDialogWidth.Small}
              isVisible={isPreviewLayoutDialogVisible}
              onClose={() => setIsPreviewLayoutDialogVisible(false)}
              triggerRef={previewLayoutTrigger}
              items={[
                {
                  label: 'Vertical',
                  icon: IconName.VerticalSplit,
                  isHighlighted: documentLayout === 'vertical',
                  onClick: () => setDocumentLayout('vertical')
                },
                {
                  label: 'Horizontal',
                  icon: IconName.HorizontalSplit,
                  isHighlighted: documentLayout === 'horizontal',
                  onClick: () => setDocumentLayout('horizontal')
                },
                {
                  label: 'Detached',
                  icon: IconName.Cards,
                  isHighlighted: documentLayout === 'detachedPreview',
                  onClick: () => {
                    setDocumentLayout('detachedPreview');
                    ipcRenderer.send('viewer-focus');
                  }
                }
              ]}
            />
          </div>
        )}

        {!isSmall && (
          <div className={css['is-padded']}>
            <Tooltip content="Split workspace vertically">
              <IconButton
                icon={IconName.VerticalSplit}
                variant={IconButtonVariant.Transparent}
                onClick={() => setDocumentLayout('vertical')}
                state={documentLayout === 'vertical' ? IconButtonState.Active : undefined}
              />
            </Tooltip>

            <Tooltip content="Split workspace horizontally">
              <IconButton
                icon={IconName.HorizontalSplit}
                variant={IconButtonVariant.Transparent}
                onClick={() => setDocumentLayout('horizontal')}
                state={documentLayout === 'horizontal' ? IconButtonState.Active : undefined}
              />
            </Tooltip>

            <Tooltip content="Detach preview from editor">
              <IconButton
                icon={IconName.Cards}
                variant={IconButtonVariant.Transparent}
                onClick={() => {
                  setDocumentLayout('detachedPreview');
                  ipcRenderer.send('viewer-focus');
                }}
                state={documentLayout === 'detachedPreview' ? IconButtonState.Active : undefined}
              />
            </Tooltip>
          </div>
        )}

        <div className={css['is-padded-l']}>
          <Tooltip
            content="Design mode"
            fineType={Keybindings.TOGGLE_PREVIEW_MODE.label}
            UNSAFE_triggerClassName={css.TooltipPositioner}
          >
            <div className={css.DesignPreviewModeButton} onClick={() => onPreviewModeChanged(false)}>
              {isSmall ? (
                <Icon icon={IconName.Pencil} variant={!previewMode ? TextType.Secondary : undefined} />
              ) : (
                <Label variant={!previewMode ? TextType.Secondary : undefined}>Design</Label>
              )}
            </div>
          </Tooltip>
          <Tooltip
            content="Set editor mode"
            fineType={Keybindings.TOGGLE_PREVIEW_MODE.label}
            UNSAFE_triggerClassName={css.TooltipPositioner}
          >
            <ToggleSwitch
              isChecked={previewMode}
              onChange={(e) => onPreviewModeChanged(e.target.checked)}
              isAlwaysActiveColor
            />
          </Tooltip>
          <Tooltip
            content="Preview mode"
            fineType={Keybindings.TOGGLE_PREVIEW_MODE.label}
            UNSAFE_triggerClassName={css.TooltipPositioner}
          >
            <div className={css.DesignPreviewModeButton} onClick={() => onPreviewModeChanged(true)}>
              {isSmall ? (
                <Icon icon={IconName.PlayCircle} variant={previewMode ? TextType.Secondary : undefined} />
              ) : (
                <Label variant={previewMode ? TextType.Secondary : undefined}>Preview</Label>
              )}
            </div>
          </Tooltip>
        </div>

        <span ref={deployButtonRef}>
          <PrimaryButton
            label={isSmall ? '' : 'Deploy'}
            icon={IconName.Rocket}
            isDisabled={deployIsDisabled}
            onClick={() => setIsDeployVisible(true)}
            UNSAFE_className={css['DeployButton']}
            testId="deploy-popup-button"
          />
        </span>
      </div>

      <DeployPopup isVisible={isDeployVisible} onClose={() => setIsDeployVisible(false)} triggerRef={deployButtonRef} />

      <MenuDialog
        title="Warnings"
        isVisible={isWarningsDialogVisible}
        onClose={() => setIsWarningsDialogVisible(false)}
        triggerRef={warningButtonRef}
        items={[...returnWarningItems(instance.allWarnings, nodeGraph)]}
        width={MenuDialogWidth.Large}
      />
    </div>
  );
}

import View from '../../../shared/view';

export type PopoutPosition = 'bottom' | 'top' | 'left' | 'right';

export default class PopupLayer extends View {
  static instance: PopupLayer;
  dragItem: any;

  resize(): void;
  render(): TSFixme;
  getContentId(): string;
  hidePopup(args: void): void;
  setContentSize(contentWidth: number, contentHeight: number): void;
  showPopup(args: TSFixme): TSFixme;
  positionPopout(popout: TSFixme, args: TSFixme): TSFixme;

  showPopout(args: {
    content: {
      el: JQuery<HTMLElement> | HTMLElement | HTMLElement[];
    };
    attachTo?: any;
    attachToPoint?: any;
    position?: PopoutPosition;
    animate?: any;
    manualClose?: any;
    /**
     * Hex color without the hash.
     * @default '313131'
     */
    arrowColor?: string;
    disableDynamicPositioning?: boolean;
    disableCentering?: boolean;
    onClose?: () => void;
  }): {
    el: any;
    onClose: any;
    position: PopoutPosition;
    animate: any;
    manualClose: any;
    attachToRect: {
      left: any;
      top: any;
      width: any;
      height: any;
    };
    resizeObserver: ResizeObserver;
  };

  setPopoutArrowColor(popout: TSFixme, color: TSFixme): void;
  hidePopouts(manual?: boolean): void;
  hidePopout(popout: TSFixme): void;
  showModal(args: TSFixme): void;
  hideModal(args?: TSFixme): void;
  hideAllModalsAndPopups(): void;
  showConfirmModal(options: TSFixme): void;
  showErrorModal(options: TSFixme): void;
  startDragging(item: TSFixme): void;
  isDragging(): boolean;
  indicateDropType(type: TSFixme): void;
  setDragMessage(message: string): void;
  dragCompleted(): void;

  showTooltip(args: TSFixme): TSFixme;
  showToast(text: string): void;

  showActivity(text: string): void;
  hideActivity(): void;
  showActivityProgress(progress: string | number): void;

  showFileDrop(): void;
  hideFileDrop(): void;

  hideTooltip(): void;
  setDragMessage(message?: string): void;

  static PopupMenu: typeof PopupMenu;
  static StringInputPopup: typeof StringInputPopup;
  static YesNoPopup: typeof YesNoPopup;
}

export interface PopupMenuOptions {
  items: TSFixme /* PopupMenuItem */[];
}

declare class PopupMenu extends View {
  constructor(args: PopupMenuOptions);
}

export interface StringInputPopupOptions {
  label: string;
  okLabel: string;
  cancelLabel: string;
  onOk: (value: string) => void;
  onCancel?: () => void;
}

declare class StringInputPopup extends View {
  constructor(args: StringInputPopupOptions);

  onOkClicked(): void;
  onCancelClicked(): void;
  onOpen(): void;
}

declare class YesNoPopup extends View {
  onYesClicked(): void;
  onNoClicked(): void;
}

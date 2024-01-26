import React from 'react';

import { Model } from '@noodl-utils/model';
import { guid } from '@noodl-utils/utils';

import { ConfirmDialog, ConfirmDialogProps } from '../views/DialogLayer/components/ConfirmDialog';

export enum DialogLayerModelEvent {
  DialogsChanged = 'dialogs-changed'
}

export type DialogLayerModelEvents = {
  [DialogLayerModelEvent.DialogsChanged]: () => void;
};

type DialogEntry = {
  id: string;
  slot: () => JSX.Element;
};

export type DialogLayerOptions = {
  /** Make it possible to only show one unique dialog at once. */
  id?: string;
};

export class DialogLayerModel extends Model<DialogLayerModelEvent, DialogLayerModelEvents> {
  public static instance = new DialogLayerModel();

  public get dialogs(): readonly DialogEntry[] {
    return this._order.map((x) => this._dialogs[x]);
  }

  private _order: string[] = [];
  private _dialogs: Record<string, DialogEntry> = {};

  constructor() {
    super();

    // const showDebug = (index) => {
    //   this.showConfirm({
    //     title: 'Hello World',
    //     text: 'Oh no' + new Array(index + 1).join('!'),
    //     onConfirm() {
    //       showDebug(index + 1);
    //     }
    //   });
    // };
    // showDebug(1);
  }

  public closeById(id: string): boolean {
    if (this._dialogs[id]) {
      this._order = this._order.filter((x) => x !== id);
      delete this._dialogs[id];
      this.notifyListeners(DialogLayerModelEvent.DialogsChanged);
      return true;
    }
    return false;
  }

  public showConfirm(props: ConfirmDialogProps & DialogLayerOptions) {
    const { onConfirm, onAbort } = props;
    const id = props.id ?? guid();

    props.onConfirm = () => {
      this.closeById(id);
      onConfirm && onConfirm();
    };

    props.onAbort = () => {
      this.closeById(id);
      onAbort && onAbort();
    };

    if (this._dialogs[id]) {
      this._order = this._order.filter((x) => x !== id);
      delete this._dialogs[id];
    }

    this._order.push(id);
    this._dialogs[id] = {
      id,
      slot: () => <ConfirmDialog {...props} />
    };
    this.notifyListeners(DialogLayerModelEvent.DialogsChanged);
  }
}

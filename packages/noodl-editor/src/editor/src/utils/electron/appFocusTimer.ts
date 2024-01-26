import { ipcRenderer } from 'electron';

export interface AppTimerOptions {
  timerInterval: number;
  returnInterval: number;
}

/**
 * Designed to run a time while the window is Active.
 *
 * Goals:
 * - Invoke the callback when the window gets focus, if the __returnInterval__ have been exceeded.
 * - Invoke the callback every __timerInterval__
 *
 * @deprecated TODO: not used anymore
 */
export class AppFocusTimer {
  private _focusedHandler: () => void;
  private _blurredHandler: () => void;

  private _intervalHandler: TSFixme;
  private _lostFocusAt: number;

  constructor(private readonly options: AppTimerOptions, private readonly callback: () => void) {
    this._focusedHandler = this._focused.bind(this);
    this._blurredHandler = this._blurred.bind(this);

    ipcRenderer.on('app-focused', this._focusedHandler);
    ipcRenderer.on('app-blurred', this._blurredHandler);

    this._startInterval();
  }

  public dispose() {
    clearInterval(this._intervalHandler);
    ipcRenderer.off('app-focused', this._focusedHandler);
    ipcRenderer.off('app-blurred', this._blurredHandler);
  }

  private _startInterval() {
    clearInterval(this._intervalHandler);
    this._intervalHandler = setInterval(this.callback, this.options.timerInterval);
  }

  private _focused() {
    const sinceBlurred = Date.now() - this._lostFocusAt;
    if (sinceBlurred > this.options.returnInterval) {
      this.callback();
    }

    this._startInterval();
  }

  private _blurred() {
    this._lostFocusAt = Date.now();
    clearInterval(this._intervalHandler);
  }
}

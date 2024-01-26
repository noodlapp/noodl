import Model from '../../../shared/model';

export class App extends Model {
  public static instance = new App();

  /**
   * Exit the Editor project.
   *
   * There is a listener in router.js that close the app.
   */
  public exitProject() {
    this.notifyListeners('exitEditor');
  }

  public maximize() {
    const win = require('@electron/remote').getCurrentWindow();
    win.isMaximized() ? win.unmaximize() : win.maximize();
  }

  public minimize() {
    const win = require('@electron/remote').getCurrentWindow();
    win.minimize();
  }

  public close() {
    const win = require('@electron/remote').getCurrentWindow();
    win.close();
  }
}

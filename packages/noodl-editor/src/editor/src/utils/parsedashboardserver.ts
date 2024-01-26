import http from 'http';
import electron from 'electron';
import express from 'express';
import ParseDashboard from '@noodl/noodl-parse-dashboard';

import { Environment } from '@noodl-models/CloudServices';

const { BrowserWindow } = require('@electron/remote');

export default class ParseDashboardServer {
  public static instance = new ParseDashboardServer();

  private browserWin: electron.BrowserWindow | undefined;
  private httpServer: http.Server;
  private currentEnvironment: Environment;
  private port: number | undefined;

  /**
   * Open the parse dashboard in the browser.
   *
   * @param environment The environment we want to open with.
   */
  openInBrowser(environment: Environment) {
    this.start(environment, (port) => {
      electron.shell.openExternal(`http://localhost:${port}`);
    });
  }

  /**
   * Open the parse dashboard in a new window.
   *
   * @param environment The environment we want to open with.
   */
  openInWindow(environment: Environment) {
    this.start(environment, (port) => {
      if (this.browserWin) {
        this.browserWin.focus();
      } else {
        this.browserWin = new BrowserWindow({
          width: 1280,
          height: 600,
          center: true,
          title: 'Cloud Services Dashboard'
        });

        this.browserWin.on('close', () => {
          this.browserWin = undefined;
        });

        this.browserWin.loadURL(`http://localhost:${port}`);
      }
    });
  }

  stop() {
    this.currentEnvironment = null;

    if (this.browserWin) {
      this.browserWin.close();
      this.browserWin = undefined;
    }

    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = undefined;
    }
  }

  private start(environment: Environment, cb: (port: number) => void) {
    const alreadyRunning =
      this.currentEnvironment &&
      this.currentEnvironment.url === environment.url &&
      this.currentEnvironment.appId === environment.appId;

    if (alreadyRunning) {
      cb(this.port);
    } else
      this.startWebServer(environment, (port) => {
        this.port = port;
        cb(port);
      });
  }

  private startWebServer(environment: Environment, cb: (port: number) => void) {
    // @ts-expect-error
    let endpoint = environment.url || environment.endpoint;
    if (endpoint.endsWith('/')) {
      endpoint = endpoint.slice(0, -1);
    }

    //app name is used as an url in the dashboard, so strip away some characters so the URLs arent invalid
    //url-encoding breaks the dashboard in some cases for some reason, so just stripping away : and / for now
    const appName = environment.name.replace(/\//g, '').replace(/\:/g, '');

    // @ts-ignore
    const dashboard = new ParseDashboard({
      apps: [
        {
          serverURL: endpoint,
          appId: environment.appId || environment.url.split(':')[0] + '-' + environment.id,
          masterKey: environment.masterKey,
          appName: appName,
          graphQLServerURL: endpoint + '/graphql'
        }
      ]
    });

    const app = express();
    app.use('/', dashboard);

    this.stop(); //stop running server (if any) so there's only one

    this.httpServer = app.listen(0, () => {
      //save current config
      this.currentEnvironment = environment;

      const address = this.httpServer.address();
      if (typeof address === 'string') throw new Error('Invalid server address type.');

      cb(address.port);
    });
  }
}

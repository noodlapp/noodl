import { ipcRenderer } from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';

import { EventDispatcher } from '../../shared/utils/EventDispatcher';
import LessonTemplatesModel from './models/lessontemplatesmodel';
import PopupLayer from './views/popuplayer';
import '@noodl-utils/keyboardhandler';
import './utils/editorapi';
import { platform } from '@noodl/platform';

import { AiAssistantModel } from '@noodl-models/AiAssistant';
import { ProjectModel } from '@noodl-models/projectmodel';

import { AppRoute } from './pages/AppRoute';
import { AppRouteOptions, AppRouter } from './pages/AppRouter';
import { EditorPage } from './pages/EditorPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { DialogLayerContainer } from './views/DialogLayer';
import { ToastLayerContainer } from './views/ToastLayer';

function createToastLayer() {
  const toastLayer = document.createElement('div');
  toastLayer.classList.add('toast-layer');
  $('body').append(toastLayer);

  ReactDOM.render(React.createElement(ToastLayerContainer), toastLayer);

  if (import.meta.webpackHot) {
    import.meta.webpackHot.accept('./views/ToastLayer', () => {
      ReactDOM.render(React.createElement(ToastLayerContainer), toastLayer);
    });
  }
}

function createDialogLayer() {
  // ---
  // Add support for the BaseDialog, since that is using React Portals this have
  // to be added to the DOM now!
  const dialogLayerPortalTarget = document.createElement('div');
  dialogLayerPortalTarget.classList.add('dialog-layer-portal-target');
  $('body').append(dialogLayerPortalTarget);

  // ---
  // Add the Dialog Layer
  const dialogLayer = document.createElement('div');
  dialogLayer.classList.add('dialog-layer');
  $('body').append(dialogLayer);

  ReactDOM.render(React.createElement(DialogLayerContainer), dialogLayer);

  if (import.meta.webpackHot) {
    import.meta.webpackHot.accept('./views/DialogLayer', () => {
      ReactDOM.render(React.createElement(DialogLayerContainer), dialogLayer);
    });
  }
}

export default class Router
  extends React.Component<
    {
      uri: string;
    },
    {
      route: any;
      routeArgs: any;
      routeName: string;
    }
  >
  implements AppRouter
{
  private _route: string;

  constructor(props) {
    super(props);

    //start at projects page
    this.state = {
      routeName: 'projects',
      route: ProjectsPage,
      routeArgs: { route: new AppRoute(this) }
    };

    console.log(`
  _   _                    _  _
 | \\ | |                  | || |
 |  \\| |  ___    ___    __| || |
 | . \` | / _ \\  / _ \\  / _\` || |
 | |\\  || (_) || (_) || (_| || |
 |_| \\_| \\___/  \\___/  \\__,_||_|

      version: ${platform.getFullVersion() || platform.getVersion()}

`);

    // Initialise models
    LessonTemplatesModel.instance.fetch();

    EventDispatcher.instance.on(
      'viewer-refresh',
      () => {
        ipcRenderer.send('viewer-refresh');
      },
      null
    );

    PopupLayer.instance = new PopupLayer();
    $('body').append(PopupLayer.instance.render());

    createDialogLayer();
    createToastLayer();

    //close the viewer. Viewer is normally closed at this point, but can be open if we refresh the editor from the dev tools
    ipcRenderer.send('viewer-attach', {});

    if (import.meta.webpackHot) {
      import.meta.webpackHot.accept('./pages/EditorPage', () => {
        if (this._route === 'editor') {
          this.setState({ route: EditorPage });
        }
      });
      import.meta.webpackHot.accept('./pages/ProjectsPage', () => {
        if (this._route === 'projects') {
          this.setState({ route: ProjectsPage });
        }
      });
    }
  }

  route(args: AppRouteOptions) {
    if (!args) return;

    // console.log(`route, from: ${this._route}, to: ${args.to}`);
    if (this._route == args.to) {
      return;
    }

    this._route = args.to;

    // TODO: Store route specific data
    const route = new AppRoute(this);

    //Set the global singleton here (and only here) to load the active project for this route
    if (ProjectModel.instance && ProjectModel.instance !== args.project) {
      //new or no project, dispose old one
      ProjectModel.instance.dispose();
      AiAssistantModel.instance.resetContexts();

      // HACK: Allow all react components to unmount un unregister the effectsbefore we delete the ProjectModel.
      setTimeout(() => {
        ProjectModel.instance = undefined;
      }, 0);
    }

    if (args.project && ProjectModel.instance !== args.project) {
      //set new project
      ProjectModel.instance = args.project;
    }

    // Routes
    if (args.to === 'editor') {
      this.setState({
        route: EditorPage,
        routeArgs: { route }
      });
    } else if (args.to === 'projects') {
      this.setState({
        route: ProjectsPage,
        routeArgs: { route, from: args.from }
      });
    }
  }

  render() {
    const Route = this.state.route;
    return Route ? <Route {...this.state.routeArgs} /> : null;
  }
}

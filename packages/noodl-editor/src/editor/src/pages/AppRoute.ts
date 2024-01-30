import { AppRouter } from "noodl-editor/src/editor/src/pages/AppRouter";

export class AppRoute {
  constructor(public readonly router: AppRouter) {}
}

export interface IRouteProps {
  route: AppRoute;
}

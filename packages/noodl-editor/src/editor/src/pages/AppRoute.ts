import { AppRouter } from "./AppRouter";

export class AppRoute {
  constructor(public readonly router: AppRouter) {}
}

export interface IRouteProps {
  route: AppRoute;
}

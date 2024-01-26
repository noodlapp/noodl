import { ProjectModel } from '@noodl-models/projectmodel';

export interface AppRouteOptions {
  to: string;
  from?: string;
  uri?: string;
  project?: ProjectModel;
}

/** TODO: This will replace Router later */
export interface AppRouter {
  route(options: AppRouteOptions): void;
}

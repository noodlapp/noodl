import { Environment } from '@noodl-models/CloudServices';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { ProjectModel } from '@noodl-models/projectmodel';
import { NodeGraphTraverser, NodeGraphTraverserOptions } from '@noodl-utils/node-graph-traverser';

import { HtmlProcessorParameters } from './build/processors/html-processor';
import { IndexedPagesOptions } from './context/pages';

interface BasePageObject {
  componentName: string;
  title: string;
  /** Relative path to base */
  path: string;
  meta: {
    [key: string]: unknown;
  };
}

export enum PageType {
  Static = 'static-page',
  Dynamic = 'dynamic-page'
}

export interface StaticPageObject extends BasePageObject {
  kind: PageType.Static;
}

export interface DynamicPageObject extends BasePageObject {
  kind: PageType.Dynamic;
}

export type PageObject = StaticPageObject | DynamicPageObject;

export interface ActivityOptions {
  message: string;
  successMessage?: string;
}

export enum NotifyType {
  Notice = 'notice',
  Success = 'success',
  Error = 'error'
}

export interface CoreContext {
  project: ProjectModel;
  environment: Environment | undefined;

  getHostname(): string | undefined;

  /**
   *
   * @param options
   * @param callback
   */
  activity(options: ActivityOptions, callback: () => Promise<void>): Promise<void>;

  /**
   *
   * @param type
   * @param message
   */
  notify(type: NotifyType, message: string): void;

  /**
   * Returns a list of all the pages with absolute paths.
   *
   * @returns [
   *    {
   *      title: "page title",
   *      path: "/path-1/path-2",
   *      meta: {}
   *    },
   *    // ...
   *  ]
   */
  getPages(options: IndexedPagesOptions): Promise<ReadonlyArray<PageObject>>;

  /**
   * Create a index.html page similar to the one created for the web app.
   *
   * @returns a string containg the HTML code.
   */
  createIndexPage(options: HtmlProcessorParameters): Promise<string>;

  /**
   * Returns a traversal graph of the nodes.
   *
   * @param selector
   * @returns
   */
  graphTraverse(selector: (node: NodeGraphNode) => boolean, options: NodeGraphTraverserOptions): NodeGraphTraverser;
}

export interface BuildContext extends CoreContext {
  outputPath: string;
}
export type PreBuildContext = BuildContext;
export interface PostBuildContext extends BuildContext {
  status: 'success' | 'failure';
}

export interface PackageContext extends CoreContext {
  packageFilePath: string;
  inputPath: string;
}
export type PrePackageContext = PackageContext;
export interface PostPackageContext extends PackageContext {
  status: 'success' | 'failure';
}

export type DeployContext = CoreContext;
export interface PreDeployContext extends DeployContext {
  environment: Environment;
}

export interface PostDeployContext extends DeployContext {
  status: 'success' | 'failure';
}

/**
 * To calculate the percentage: (progress / progressTotal) * 100
 */
export interface DeployProgressContext extends DeployContext {
  progress: number;
  progressTotal: number;
}

export interface BuildScript {
  /** Occurs before the build. */
  onPreBuild?(context: PreBuildContext): Promise<void>;

  /** Occurs after the build. */
  onPostBuild?(context: PostBuildContext): Promise<void>;

  /** Occurs before the build is deployed. */
  onPreDeploy?(context: PreDeployContext): Promise<void>;

  /** Occurs after the build is deployed. */
  onPostDeploy?(context: PostDeployContext): Promise<void>;

  /** Occurs when the build is being deployed. */
  onDeployProgress?(context: DeployProgressContext): void;
}

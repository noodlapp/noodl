import { sortBy } from 'underscore';
import { filesystem } from '@noodl/platform';

import { Environment } from '@noodl-models/CloudServices';
import { getGitStats } from '@noodl-models/CloudServices/GitStats';
import { ProjectModel } from '@noodl-models/projectmodel';
import { HtmlProcessorParameters } from '@noodl-utils/compilation/build/processors/html-processor';
import { SitemapBuildScript } from '@noodl-utils/compilation/passes/sitemap';
import { NodeGraphTraverser } from '@noodl-utils/node-graph-traverser';

import Model from '../../../../shared/model';
import { BuildScript, CoreContext, NotifyType } from './build-context';
import { createIndexPage, deployToFolder } from './build/deployer';
import { getIndexedPages } from './context/pages';
import { deployCloudFunctionBuildScript } from './passes/deploy-cloud-functions';

export interface DeployOptions {
  /** Default: true */
  useBundles?: boolean;
  environment: Environment | undefined;
  runtimeType?: string;
}

// TODO: Make something more global inside @noodl/platform, to handle this.
export interface IFeedbackProvider {
  showActivity(message: string, id: string): void;
  hideActivity(id: string): void;
  showSuccess(message: string): void;
  showError(message: string): void;
  showInteraction(message: string): void;
}

export type CompilationOptions = {
  cloneProject?: boolean;
};

/**
 * Compilation is a class that can be used to compile a project.
 *
 * @example
 * ```typescript
 * const compilation = createEditorCompilation(ProjectModel.instance)
 *   .addProjectBuildScripts()
 *   .addBuildScript({
 *     async onPostDeploy({ status }) {
 *       if (status === 'success') {
 *         PopupLayer.instance.hideActivity();
 *         PopupLayer.instance.showToast('Project deployed successfully!');
 *       } else {
 *         PopupLayer.instance.hideActivity();
 *         PopupLayer.instance.showToast('Could not upload deploy content.');
 *       }
 *     },
 *     onDeployProgress({ progress, progressTotal }) {
 *       PopupLayer.instance.showActivity('Deploying project');
 *       PopupLayer.instance.showActivityProgress((progress / progressTotal) * 100);
 *     }
 *   });
 *
 * compilation.deployToFolder("filepath", { environment: undefined });
 * ```
 */
export class Compilation {
  private buildScripts: BuildScript[] = [];
  private doLoadProjectBuildScripts = false;
  private doLoadProjectBuildScriptsDone = false;

  constructor(
    public readonly project: ProjectModel,
    private readonly feedback: IFeedbackProvider,
    private readonly options: CompilationOptions
  ) {
    if (!project) throw 'ProjectModel is not defined';

    // Add our build scripts
    this.addBuildScript(deployCloudFunctionBuildScript);
    this.addBuildScript(SitemapBuildScript);
  }

  private createCoreContext(environment: Environment): CoreContext {
    let projectClone = this.project;

    if (this.options.cloneProject) {
      // Clone the project model so that the build scripts can modify it however they like.
      Model._listenersEnabled = false; // Disable model listeners while loading project, otherwise this will bog down large projects
      projectClone = ProjectModel.fromJSON(this.project.toJSON());
      Model._listenersEnabled = true;

      projectClone.modules = JSON.parse(JSON.stringify(this.project.modules));
      projectClone._retainedProjectDirectory = this.project._retainedProjectDirectory;
    }

    return {
      project: projectClone,
      environment,
      getHostname() {
        let hostname = projectClone.settings.baseUrl;
        if (hostname) {
          if (!hostname.endsWith('/')) {
            hostname = hostname + '/';
          }
          // TODO: Not sure if we want this:
          // if (!hostname.startsWith('http')) {
          //   hostname = 'https://' + hostname;
          // }
        }
        return hostname;
      },
      activity: async (options, callback) => {
        const activityId = 'build-script-context-activity';
        this.feedback.showActivity(options.message, activityId);

        try {
          await callback();
          this.feedback.showSuccess(options.successMessage || options.message);
        } catch (error) {
          this.feedback.showError(error);
        }

        this.feedback.hideActivity(activityId);
      },
      notify: (type, message) => {
        switch (type) {
          default:
          case NotifyType.Notice:
            this.feedback.showInteraction(message);
            break;

          case NotifyType.Success:
            this.feedback.showSuccess(message);
            break;

          case NotifyType.Error:
            this.feedback.showError(message);
            break;
        }
      },
      graphTraverse(selector, options = {}) {
        return new NodeGraphTraverser(this.project, selector, options);
      },
      getPages(options) {
        return getIndexedPages(this.project, options);
      },
      createIndexPage(parameters: HtmlProcessorParameters) {
        return createIndexPage(this.project, parameters);
      }
    };
  }

  /**
   * Add the build scripts in the project folder.
   *
   * @returns
   */
  addProjectBuildScripts(): this {
    // Mark that we want to load the project build scripts,
    // and we will do that async once the build starts.
    this.doLoadProjectBuildScripts = true;
    return this;
  }

  /**
   * Add a custom build script.
   *
   * @param buildScript
   * @returns
   */
  addBuildScript(buildScript: BuildScript): this {
    this.buildScripts.push(buildScript);
    return this;
  }

  /**
   * Deploy the project to a folder.
   *
   * @param filePath
   * @param options
   * @returns
   */
  deployToFolder(filePath: string, options: DeployOptions): Promise<void> {
    return this.deployToFolderWithContext(filePath, options, this.createCoreContext(options.environment));
  }

  /**
   * Reuse the same core context when building.
   *
   * @param filePath
   * @param options
   * @param coreContext
   */
  private async deployToFolderWithContext(filePath: string, options: DeployOptions, coreContext: CoreContext) {
    await this.loadProjectBuildScripts();

    const projectSettings = this.project.getSettings();

    const common = {
      ...coreContext,
      outputPath: filePath
    };

    await this.callBuildScripts('onPreBuild', common);

    const envVariables: Record<string, string> = {};

    if (projectSettings.deployEnvDate) {
      envVariables['DeployedAt'] = new Date().toUTCString();
    }

    if (projectSettings.deployEnvGitStats) {
      const stats = await getGitStats();
      envVariables['GitBranch'] = stats.gitBranch;
      envVariables['GitSha'] = stats.gitSha;
    }

    try {
      await deployToFolder({
        project: coreContext.project,
        direntry: filePath,
        environment: options.environment,
        baseUrl: coreContext.getHostname(),
        runtimeType: options.runtimeType,
        envVariables
      });

      await this.callBuildScripts('onPostBuild', { ...common, status: 'success' });
    } catch (error) {
      await this.callBuildScripts('onPostBuild', { ...common, status: 'failure' });
      throw error;
    }
  }

  // Since moving the filesystem to async we have to load this just before the build
  // starts, to make sure that the files are loaded when starting to build.
  private async loadProjectBuildScripts() {
    if (!this.doLoadProjectBuildScripts) return;
    if (this.doLoadProjectBuildScriptsDone) return;

    // Create the path where the build scripts are located.
    const buildScriptLocation = filesystem.join(this.project._retainedProjectDirectory, '.noodl', 'build-scripts');

    // Build script folder doesn't exist.
    if (!filesystem.exists(buildScriptLocation)) {
      return this;
    }

    // Read all the files in that directory
    // TODO: Add all the build script without a fire-n-forget
    const files = await filesystem.listDirectory(buildScriptLocation);

    // - Select what files we want to load as build scripts.
    // - And order them by alphabetical order.
    let scriptFiles = files
      .filter((x) => !x.isDirectory)
      // TOOD: Should we check fullPath here?
      .map((x) => filesystem.join(buildScriptLocation, x.name))
      .filter((x) => x.endsWith('.build.js'));
    scriptFiles = sortBy(scriptFiles);

    // Parse all the files
    const readTasks = scriptFiles.map(async (filePath) => {
      // TODO: Add all the build script without a fire-n-forget
      const fileContent = await filesystem.readFile(filePath);

      try {
        const buildScript = eval(fileContent);
        if (buildScript) {
          this.addBuildScript(buildScript);
          console.log(`Add build script: '${filePath}'`);
        }
      } catch (error) {
        console.error(`Failed to execute build script '${filePath}'`);
        console.error(error);
      }
    });

    await Promise.all(readTasks);

    this.doLoadProjectBuildScriptsDone = true;
  }

  /**
   * Call a build script function in a safe environment.
   *
   * @param code
   * @param args
   */
  private async callBuildScripts<TKey extends keyof BuildScript>(code: TKey, ...args: Parameters<BuildScript[TKey]>) {
    for (const buildScript of this.buildScripts) {
      if (buildScript[code]) {
        try {
          await buildScript[code].apply(null, args);
        } catch (error) {
          // This can be an external script, so we don't want to crash the whole compilation.
          // Therefor we will only log the error.
          console.error(`Failed to execute build script ${code}`);
          console.error(error);
        }
      }
    }
  }
}

import { ProjectModel } from '@noodl-models/projectmodel';

import ProjectModules from '../../../../../../shared/utils/projectmodules';

export interface HtmlProcessorParameters {
  /**
   * Override the title from project settings.
   *
   * Default: undefined
   */
  title?: string;

  /**
   * Append the headcode from the project settings.
   *
   * Default: undefined
   */
  headCode?: string;

  /**
   * Path to the index.js file
   *
   * Default: undefined
   */
  indexJsPath?: string;

  baseUrl?: string;
  envVariables?: Record<string, string>;
}

export class HtmlProcessor {
  constructor(public readonly project: ProjectModel) {}

  public async process(content: string, parameters: HtmlProcessorParameters): Promise<string> {
    const settings = this.project.getSettings();

    let baseUrl = parameters.baseUrl || settings.baseUrl || '/';

    // Make sure the baseUrl always ends with a slash
    if (settings.baseUrl && !settings.baseUrl.endsWith('/')) {
      baseUrl = baseUrl + '/';
    }

    const title = parameters.title || settings.htmlTitle || 'Fluxscape Viewer';
    let headCode = settings.headCode || '';

    if (parameters.headCode) {
      headCode += parameters.headCode;
    }

    if (baseUrl !== '/') {
      headCode = `<base href="${baseUrl}" target="_blank" />\n` + headCode;
    }

    // Inject modules, title, head code
    let injected = await this.injectIntoHtml(content, baseUrl);
    injected = injected.replace('{{#title#}}', title);
    injected = injected.replace('{{#customHeadCode#}}', headCode);
    injected = injected.replace(/%baseUrl%/g, baseUrl);

    // Inject path to index.js
    const indexJsPath = parameters.indexJsPath || 'index.js';
    let indexCode = `<script src="${baseUrl}${indexJsPath}"></script>`;

    const envListCode = Object.entries(parameters.envVariables || {})
      .map(([name, variable]) => {
        return `  Noodl.Env['${name}'] = '${variable}';`;
      })
      .join('\n');

    let str = `Noodl.Env['BaseUrl'] = '${baseUrl}';`;
    if (envListCode) {
      str += '\n' + envListCode;
    }

    indexCode += `
<script>
(function () {
  ${str}
})();
</script>`;

    injected = injected.replace('<%index_js%>', indexCode);

    return injected;
  }

  private injectIntoHtml(template: string, pathPrefix: string) {
    return new Promise<string>((resolve) => {
      ProjectModules.instance.injectIntoHtml(this.project._retainedProjectDirectory, template, pathPrefix, resolve);
    });
  }
}

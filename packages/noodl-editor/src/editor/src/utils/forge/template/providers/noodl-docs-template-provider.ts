import { ITemplateProvider, ProgressCallback, TemplateItem, TemplateListFilter } from '../template';

/**
 * List all templates from Noodl docs,
 * currently saved on GitHub and served via GitHub pages.
 */
export class NoodlDocsTemplateProvider implements ITemplateProvider {
  get name(): string {
    return this.getDocsEndpoint() || 'https://docs.fluxscape.io';
  }

  constructor(private readonly getDocsEndpoint: () => string) {}

  async list(_options: TemplateListFilter): Promise<readonly TemplateItem[]> {
    const endpoint = this.getDocsEndpoint();
    const templates = await this.makeRequest(endpoint);
    templates.forEach((t) => {
      t.iconURL = endpoint + '/projecttemplates/' + t.iconURL;
      t.projectURL = endpoint + '/projecttemplates/' + t.projectURL;
      if (t.cloudServicesTemplateURL !== undefined && !t.cloudServicesTemplateURL.startsWith('http')) {
        t.cloudServicesTemplateURL = endpoint + '/projecttemplates/' + t.cloudServicesTemplateURL;
      }
    });

    return templates;
  }

  canDownload(_url: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  download(_url: string, _destination: string, _progress: ProgressCallback): Promise<void> {
    throw new Error('Method not supported.');
  }

  private async makeRequest(endpoint: string) {
    const url = endpoint + '/projecttemplates/index.json' + '?' + new Date().getTime();
    const response = await fetch(url);
    return (await response.json()) as any[];
  }
}

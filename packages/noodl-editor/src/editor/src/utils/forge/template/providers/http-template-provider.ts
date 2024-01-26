import { ITemplateProvider, ProgressCallback, TemplateItem, TemplateListFilter } from '../template';
import { filesystem } from '@noodl/platform';

/**
 * HttpTemplateProvider is only for downloading templates via HTTP.
 */
export class HttpTemplateProvider implements ITemplateProvider {
  get name(): string {
    return 'Http';
  }

  list(_options: TemplateListFilter): Promise<readonly TemplateItem[]> {
    return Promise.resolve([]);
  }

  canDownload(_url: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  async download(url: string, destination: string, progress: ProgressCallback): Promise<void> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/zip'
      }
    });

    const arrayBuffer = await response.arrayBuffer();
    await filesystem.writeFile(destination, Buffer.from(arrayBuffer));
  }
}

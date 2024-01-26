import { ITemplateProvider, TemplateItem, TemplateListFilter } from './template';
import { platform, filesystem } from '@noodl/platform';

export interface TemplateDownloadOptions {
  templateUrl: string;
  // silent?: boolean;
}

/**
 * @example List templates
 * ```ts
 *  const templates = await templateRegistry.list({});
 * ```
 *
 * @example Download a template
 * ```ts
 *  const templateUrl = "https:://my-template.url/template.zip";
 *  const zipPath = await templateRegistry.download({ templateUrl });
 * ```
 */
export class TemplateRegistry {
  constructor(public readonly providers: ITemplateProvider[]) {}

  public async list(options: TemplateListFilter): Promise<ReadonlyArray<TemplateItem>> {
    let collection: TemplateItem[] = [];

    for (let index = 0; index < this.providers.length; index++) {
      const provider = this.providers[index];
      try {
        const response = await provider.list(options);
        if (response.length > 0) {
          collection = [...collection, ...response];
        }
      } catch (error) {
        console.error(`Error when listing templates via '${provider.name}' provider`);
        console.error(error);
      }
    }

    return collection;
  }

  /**
   * Download a project template.
   */
  public async download({ templateUrl }: TemplateDownloadOptions): Promise<string> {
    const templateDir = platform.getUserDataPath() + '/projecttemplates';

    const templateName = templateUrl.replace(/[:\/?=]/g, '-');
    const templatePath = templateDir + '/' + templateName;
    const templateZipPath = templatePath + '-unzipped';

    if (!filesystem.exists(templateZipPath)) {
      // Make sure we have the template folder
      await filesystem.makeDirectory(templateDir);

      // Download the template
      await this.downloadViaProvider(templateUrl, templatePath);

      // Unzip
      await filesystem.makeDirectory(templateZipPath);
      await filesystem.unzipUrl(templatePath, templateZipPath);
    }

    return templateZipPath;
  }

  private async downloadViaProvider(templateUrl: string, destination: string) {
    for (let index = 0; index < this.providers.length; index++) {
      const provider = this.providers[index];
      try {
        if (await provider.canDownload(templateUrl)) {
          await provider.download(templateUrl, destination, () => {
            // TODO: Handle progress (not something we did in the older version)
          });
          return;
        }
      } catch (error) {
        console.error(`Error when downloading template via '${provider.name}' provider`);
        console.error(error);
      }
    }

    throw new Error(`Cannot find a valid template provider for: '${templateUrl}'`);
  }
}

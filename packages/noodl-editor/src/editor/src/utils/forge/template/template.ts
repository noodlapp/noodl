export type ProgressCallback = (args: { progress: number; total: number }) => void;

export interface TemplateListFilter {}

export interface TemplateItem {
  iconURL: string;
  title: string;
  desc: string;
  category: string;
  projectURL: string;

  useCloudServices?: boolean;
  cloudServicesTemplateURL?: string;
}

/**
 * ITemplateProvider adds the functionality:
 * - to download templates
 * - provide feeds for templates.
 */
export interface ITemplateProvider {
  /**
   * Returns the provider name
   */
  get name(): string;

  list(options: TemplateListFilter): Promise<ReadonlyArray<TemplateItem>>;

  /**
   *
   */
  canDownload(url: string): Promise<boolean>;

  /**
   *
   * @param url Template URL
   * @param destination The destination we will save the ZIP file.
   * @param progress
   */
  download(url: string, destination: string, progress: ProgressCallback): Promise<void>;
}

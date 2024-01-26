import { filesystem } from '@noodl/platform';

import { BuildScript, NotifyType } from '@noodl-utils/compilation/build-context';

// TODO: Handle sitemap file limits
// const MAX_URLS_PER_FILE = 50000;
// const MAX_FILE_SIZE_BYTES = 50 * 1048576; // 50 MB

type SitemapChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq: SitemapChangeFreq;
  priority: number;
} & Record<string, string | number>;

function generateSitemapXml(urls: SitemapUrl[]) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" 
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" 
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>\n`;

  xml += urls
    .map((item) => {
      let entry = `  <url>\n`;
      Object.keys(item).forEach((key) => {
        entry += `    <${key}>${item[key]}</${key}>\n`;
      });
      return entry + `  </url>\n`;
    })
    .join('');

  return xml + `</urlset>`;
}

function encodeXml(value: string): string {
  return value.replace(/[<>&'"]/g, function (match) {
    switch (match) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
    }
  });
}

export const SitemapBuildScript: BuildScript = {
  async onPostBuild(context) {
    const enabled = !!context.project.settings['sitemap.enabled'];
    if (!enabled) {
      return;
    }

    const baseUrl = context.getHostname() || '/';

    // ---
    // Create the metadata required to know about all the pages.
    const pages = await context.getPages({});

    const metadata = {
      __comment: 'This is required for SSR to quickly understand what pages exist.',
      pages
    };

    await filesystem.writeJson(context.outputPath + '/.sitemap.metadata.json', metadata);

    // ---
    // Build the sitemap
    const urls: SitemapUrl[] = [];

    for (const page of pages) {
      const component = context.project.getComponentWithName(page.componentName);
      const pageNode = component.graph.roots.find((x) => x.typename === 'Page');

      // ---
      // Push the page
      if (pageNode.parameters.sitemapIncluded === undefined || pageNode.parameters.sitemapIncluded === true) {
        const loc = encodeXml(page.path);
        urls.push({
          loc: baseUrl + loc,
          changefreq: pageNode.parameters.sitemapChangefreq || 'weekly',
          priority: pageNode.parameters.sitemapPriority || 0.5
        });
      }

      // ---
      // Push the dynamic pages
      const codeText = pageNode.parameters.sitemapScript;
      if (!codeText) {
        continue;
      }

      try {
        const func = new Function(codeText);

        // TODO: Make this parallel later
        // TODO: Noodl API?
        // TODO: Verify the result?
        const newUrls = await func.apply(null);

        if (!Array.isArray(newUrls)) {
          continue;
        }

        newUrls.forEach((x) => {
          let loc = encodeXml(x.loc);

          if (!loc.startsWith('http') && !loc.startsWith('/')) {
            loc = '/' + loc;
          }

          if (!loc.startsWith('http')) {
            loc = baseUrl + loc;
          }

          urls.push({
            loc,
            changefreq: x.changefreq || 'weekly',
            priority: x.priority || 0.5
          });
        });
      } catch (error) {
        console.error(error);
        context.notify(NotifyType.Error, `Sitemap failed on '${component.name}' component with:` + error);
      }
    }

    const sitemap = generateSitemapXml(urls);
    await filesystem.writeFile(context.outputPath + '/sitemap.xml', sitemap);
  }
};

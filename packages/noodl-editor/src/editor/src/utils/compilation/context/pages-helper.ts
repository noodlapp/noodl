import { NodeGraphNode } from '@noodl-models/nodegraphmodel';

/**
 * Returns the Page Title from the Page node.
 *
 * @param node The Page node.
 * @returns The Page title.
 */
export function getPageTitle(node: NodeGraphNode): string {
  if (node.parameters.urlPath) {
    return String(node.parameters.urlPath);
  }

  // @ts-ignore node.owner...
  const titleParts = node.owner.owner.name.split('/');
  return titleParts[titleParts.length - 1];
}

/**
 * Returns the Page URL from the Page node.
 *
 * @param node The Page node.
 * @returns The Page URL.
 */
export function getPageUrl(node: NodeGraphNode): string {
  if (node.parameters.urlPath) {
    return String(node.parameters.urlPath);
  }

  // @ts-ignore node.owner...
  const titleParts = node.owner.owner.name.split('/');
  const title = node.parameters['title'] || titleParts[titleParts.length - 1];
  return title.replace(/\s+/g, '-').toLowerCase();
}

/**
 * Returns a all the variables from the URL path.
 *
 * @param path The page path.
 * @returns The variables.
 */
export function getPathVariables(path: string): { query: string; name: string }[] {
  const match = path.match(/\{([^}]+)\}/g);
  if (match) {
    return match.map((m) => ({ query: m, name: m.replace('{', '').replace('}', '') }));
  }
  return [];
}

import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';

import { HttpTemplateProvider } from './template/providers/http-template-provider';
import { NoodlDocsTemplateProvider } from './template/providers/noodl-docs-template-provider';
import { TemplateRegistry } from './template/template-registry';

// The order of the providers matters,
// when looking for a template it will take the first one that allows it.
const templateRegistry = new TemplateRegistry([
  new NoodlDocsTemplateProvider(getDocsEndpoint),
  new HttpTemplateProvider()
]);

export { templateRegistry };

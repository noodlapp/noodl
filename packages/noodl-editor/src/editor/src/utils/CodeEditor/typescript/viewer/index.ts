import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { ProjectModel } from '@noodl-models/projectmodel';
import { getPageRoutes } from '@noodl-utils/compilation/context/pages';
import SchemaHandler from '@noodl-utils/schemahandler';

import { getCloudFunctions, getIdentifiers } from '../../context';
import { TypescriptModule } from '../helper';

function typeToTypescript(type: string | { name: string }) {
  function convert(type: string) {
    switch (type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'array':
        return 'any[]';
      default:
        return 'any';
    }
  }

  return typeof type === 'string' ? convert(type) : convert(type.name);
}

async function GetSource() {
  const project = ProjectModel.instance;

  // ---
  // Identifiers
  const identifiers = getIdentifiers(project);

  // ---
  // Database
  const schema = SchemaHandler.instance;
  if (typeof schema.haveCloudServices === 'undefined') {
    try {
      await schema._fetch();
    } catch (error) {
      // lets ignore it then...
      console.error(error);
    }
  }

  // ---
  // Cloud Functions
  const cloudFunctions = getCloudFunctions(project);
  const tsCloudFunctions = cloudFunctions.map((x) => {
    return {
      name: x.name,
      displayName: x.displayName,
      fullName: x.fullName,
      inputs: x.inputs.reduce((result, item) => {
        result[item.name] = typeToTypescript(item.type);
        return result;
      }, {}),
      outputs: x.outputs.reduce((result, item) => {
        result[item.name] = item.types.map((x) => typeToTypescript(x)).join(' | ');
        return result;
      }, {})
    };
  });

  // ---
  // Page Routes & page routers
  const pageRoutes = await getPageRoutes(project, {});
  const pageRouters = pageRoutes.routes.reduce((result, item) => {
    result[item.componentName] = { routerName: item.routerName };
    return result;
  }, {});

  return CreateSource({
    isLoading: false,
    identifiers,
    dbCollections: schema.dbCollections || [],
    cloudFunctions: tsCloudFunctions,
    pages: pageRoutes.pages,
    pageRouters: pageRouters
  });
}

interface ISourceOptions {
  isLoading?: boolean;
  identifiers?: TSFixme;
  dbCollections?: TSFixme[];
  cloudFunctions?: {
    name: string;
    displayName: string;
    fullName: string;
    inputs: {
      [name: string]: string;
    };
    outputs: {
      [name: string]: string;
    };
  }[];
  pages?: TSFixme[];
  pageRouters?: {
    [componentName: string]: {
      routerName: string;
    };
  };
}

function CreateSource({
  isLoading = true,
  identifiers = {},
  dbCollections = [],
  cloudFunctions = [],
  pages = [],
  pageRouters = {}
}: ISourceOptions) {
  // ---
  // Identifiers
  const identifierKeys = Object.keys(identifiers);

  // NOTE: Always make sure we have this property in there.
  //       Come up with a better solution for this
  if (!identifierKeys.includes('VariableName')) {
    identifierKeys.push('VariableName');
  }

  const identifierSource = identifierKeys.map((key) => {
    let str = `    ['${key}']: {\n`;

    if (identifiers[key]) {
      identifiers[key].forEach((name) => {
        str += `      ['${name}']: {},\n`;
      });
    }

    return str + `    }`;
  });

  // ---
  // Database
  const dbCollectionsSource = dbCollections.map((collection) => {
    let str = `    ['${collection.name}']: {\n`;

    Object.keys(collection.schema.properties).forEach((name) => {
      const property = collection.schema.properties[name];
      const source = JSON.stringify(property, null, 2).replace(/\n/g, '\n      ');
      str += `      ['${name}']: ${source},\n`;
    });

    return str + `    }`;
  });

  // ---
  // Cloud Functions
  const cloudFunctionsSource = cloudFunctions.map((cf) => {
    let str = `    ['${cf.displayName}']: {\n`;
    str += `      fullName: '${cf.fullName}',\n`;
    str += `      inputs: {\n`;
    Object.entries(cf.inputs).forEach(([name, type]) => {
      str += `        ['${name.substring(3)}']: ${type},\n`;
    });
    str += `      },\n`;
    str += `      outputs: {\n`;
    Object.entries(cf.outputs).forEach(([name, type]) => {
      str += `        ['${name.substring(3)}']: ${type},\n`;
    });
    str += `      },\n`;
    return str + `    }`;
  });

  // ---
  // Pages
  const pagesSource = pages.map((page) => {
    const source = JSON.stringify(page, null, 2).replace(/\n/g, '\n    ');
    const str = `    ['${page.componentName}']: ${source}`;
    return str;
  });

  const routerNames = Object.keys(
    Object.values(pageRouters).reduce((result, item) => {
      result[item.routerName] = true;
      return result;
    }, {})
  );

  // In case there are none, or loading state. Add 'Main' by default.
  if (routerNames.length === 0) {
    routerNames.push('Main');
  }

  const routerNamesSource = routerNames.map((routerName) => {
    return `'${routerName}'`;
  });

  // ---
  // Final
  const createComment = (text: string, tabs = 2) => {
    const tabsText = new Array(tabs + 1).join(' ');

    if (isLoading) {
      return tabsText + '/* Loading... */';
    }

    // A little ugly code, but it's all to make the comments look nice.
    let result = `/**\n ${text}\n*/`;
    result = result
      .split('\n')
      .map((line) => {
        if (line.startsWith('/')) {
          return tabsText + line + '\n';
        }
        if (line.startsWith('*')) {
          return tabsText + ' ' + line + '\n';
        }
        return tabsText + ' *' + line + '\n';
      })
      .join('')
      .slice(0, -1);

    return result;
  };

  return `//
// Auto generated typings based on the App.
//

declare namespace Noodl {
  type Identifiers = {
${identifierSource.join(',\n')}
  }

${createComment('The variables names from the Variable nodes.')}
  type VariableNames = keyof Identifiers["VariableName"] & string;

  type DatabaseSchema = {
${dbCollectionsSource.join(',\n')}
  }

${createComment('The Database Record ClassNames')}
  type RecordClassName = keyof DatabaseSchema & string;

  type CloudFunctionSchema = {
${cloudFunctionsSource.join(',\n')}
  }

${createComment('All the pages.')}
  type PagesSchema = {
${pagesSource.join(',\n')}
  }

${createComment('All the page routers.')}
  type PageRouterNames = ${routerNamesSource.join(' | ')};
}
`;
}

export function GetOrCreateViewerModel(): TypescriptModule {
  const libPathName = 'inmemory://@noodl/viewer/global.d.ts';
  const libUri = monaco.Uri.parse(libPathName);

  const pkg = new TypescriptModule();

  // Create model
  const model = monaco.editor.getModel(libUri);
  if (model) {
    pkg.setModel(model);
  } else {
    const loadingSource = CreateSource({});
    pkg.setExtraLib(monaco.languages.typescript.javascriptDefaults.addExtraLib(loadingSource, libPathName));
    pkg.setModel(monaco.editor.createModel(loadingSource, 'typescript', libUri));
  }

  (async () => {
    const source = await GetSource();
    pkg.setExtraLib(monaco.languages.typescript.javascriptDefaults.addExtraLib(source, libPathName));
    pkg.setSource(source);
  })();

  return pkg;
}

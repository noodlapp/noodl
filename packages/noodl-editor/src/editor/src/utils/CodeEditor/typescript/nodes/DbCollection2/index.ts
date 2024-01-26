import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { NodeGraphNode } from '@noodl-models/nodegraphmodel';

import { plugTypeToTSDef, TypescriptModule } from '../../helper';

const STATIC = `
declare const Inputs: any;

interface DbKlass {
  createdAt?: DateFilter,
  updatedAt?: DateFilter,
  Name?: StringFilter,
  value?: NumberFilter;
}

interface DateFilter {
  exist?: boolean;
  equalTo?: Date;
}

interface StringFilter {
  exist?: boolean;
  equalTo?: string;
  containedIn?: string[];
  text?: {
    search: string | {
      term: string;
      caseSensitive?: boolean;
    };
  }
  matchesRegex?: any;
}

interface NumberFilter {
  exist?: boolean;
  lessThan?: number;
  lessThanOrEqualTo: number;
  greaterThan?: number;
  greaterThanOrEqualTo?: number;
  equalTo?: number;
  notEqualTo: number;
  containedIn?: number[];
  notContainedIn?: number[];
}

interface GeoPointNearSphere {
  exist?: boolean;
  nearSphere: {
    latitude: number;
    longitude: number;
    maxDistanceInKilometers: number;
  }
}

interface GeoPointWithinBox {
  exist?: boolean;
  withinBox: [
    {
      latitude: number;
      longitude: number;
    },
    {
      latitude: number;
      longitude: number;
    }
  ];
}

interface GeoPointWithinPolygon {
  exist?: boolean;
  withinPolygon: {
    latitude: number;
    longitude: number;
  }[];
}

type GeoPointFilter =
  | GeoPointNearSphere
  | GeoPointWithinBox
  | GeoPointWithinPolygon;

interface Klass extends DbKlass {
  idEqualTo?: string;
  idContainedIn?: string[];
}

type WhereFilter = 
  | Klass
  | {
      and: Klass[];
    }
  | {
      or: Klass[];
    };

type SortKey = \`\${('' | '-')}\${keyof DbKlass}\`;

/**
 * Define the Filter.
 */
declare function where(filter: WhereFilter): void;

/**
 * Takes an array with strings specifying the names of the properties you want
 * to sort by. You can prefix the property name with "-" to specify that you
 * want to sort in descending order instead of the default ascending order.
 */
declare function sort(pattern: SortKey[]): void;
`;

function functionLib(node: NodeGraphNode) {
  const ports = (node?.getPorts() ?? [])
    .filter((x) => ['Inputs', 'Outputs'].includes(x.group))
    .map((x) => ({
      name: x.displayName || x.name,
      type: plugTypeToTSDef(x.type, x.group === 'Inputs'),
      group: x.group
    }));

  const inputs: string[] = [];
  const outputs: string[] = [];

  ports.forEach((p) => {
    if (p.group === 'Inputs') {
      inputs.push(`    readonly ['${p.name}']: ${p.type};`);
    }

    if (p.group === 'Outputs') {
      outputs.push(`    ['${p.name}']: ${p.type};`);
    }
  });

  return STATIC;
}

function buildNodeLib(node: NodeGraphNode) {
  const libPathName = 'inmemory://@noodl/nodes/DbCollection2/DbCollection2.d.ts';
  const libUri = monaco.Uri.parse(libPathName);

  const source = functionLib(node);

  return {
    source,
    libPathName,
    libUri
  };
}

export function registerOrUpdate_DbCollection2(node: NodeGraphNode): TypescriptModule {
  const { source, libPathName, libUri } = buildNodeLib(node);

  const pkg = new TypescriptModule();
  pkg.setLib(['es2020']);

  // Try get the model
  const model = monaco.editor.getModel(libUri);
  if (model) {
    pkg.setModel(model);
    pkg.setSource(source);
  } else {
    const model = monaco.editor.createModel(source, 'typescript', libUri);
    pkg.setModel(model);

    pkg.setExtraLib(monaco.languages.typescript.javascriptDefaults.addExtraLib(source, libPathName));
    pkg.setSource(source);
  }

  return pkg;
}

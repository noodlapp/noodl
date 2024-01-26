import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';

import { plugTypeToTSDef, TypescriptModule } from '../../helper';

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

  return [
    'type Prettify<T> = {',
    '  [K in keyof T]: T[K];',
    '} & {};',
    '',
    'type InputTypes = {',
    ...inputs,
    '',
    '    readonly [key: string]: any;',
    '}',
    '',
    'type OutputTypes = {',
    ...outputs,
    '',
    '    [key: string]: unknown;',
    '}',
    '',
    'declare const Inputs: Prettify<InputTypes>;',
    'declare const Outputs: Prettify<OutputTypes>;'
  ].join('\n');
}

function buildNodeLib(node: NodeGraphNode) {
  const libPathName = 'inmemory://@noodl/nodes/JavaScriptFunction/JavaScriptFunction.d.ts';
  const libUri = monaco.Uri.parse(libPathName);

  const source = functionLib(node);

  return {
    source,
    libPathName,
    libUri
  };
}

export function registerOrUpdate_JavaScriptFunction(node: NodeGraphNode, runtimeType: RuntimeType): TypescriptModule {
  const { source, libPathName, libUri } = buildNodeLib(node);

  const pkg = new TypescriptModule();

  switch (runtimeType) {
    case RuntimeType.Browser:
      pkg.setLib(['dom', 'es2020']);
      break;

    case RuntimeType.Cloud:
      pkg.setLib(['es2020']);
      break;
  }

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

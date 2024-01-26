import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { uniq } from 'underscore';

import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { RuntimeType } from '@noodl-models/nodelibrary/NodeLibraryData';
import { EditorModel } from '@noodl-utils/CodeEditor/model/editorModel';
import { TypescriptModule } from '@noodl-utils/CodeEditor/typescript/helper';
import { registerOrUpdate_DbCollection2 } from '@noodl-utils/CodeEditor/typescript/nodes/DbCollection2';
import { registerOrUpdate_Expression } from '@noodl-utils/CodeEditor/typescript/nodes/Expression';
import { registerOrUpdate_Javascript2 } from '@noodl-utils/CodeEditor/typescript/nodes/Javascript2';
import { registerOrUpdate_JavaScriptFunction } from '@noodl-utils/CodeEditor/typescript/nodes/JavaScriptFunction';
import { GetOrCreateViewerModel } from '@noodl-utils/CodeEditor/typescript/viewer';
import { GetOrCreateViewerCloudModel } from '@noodl-utils/CodeEditor/typescript/viewer-cloud';
import { GetOrCreateViewerReactModel } from '@noodl-utils/CodeEditor/typescript/viewer-react';
import { getNodeGraphNodeRuntimeType } from '@noodl-utils/NodeGraph';

import { codeEditorTypeToLanguageId } from './mappings';

export interface createModelOptions {
  type: string;
  value: string;
  codeeditor: string;
}

/**
 * Create the Monaco Model, with better typings etc
 */
export function createModel(options: createModelOptions, node: NodeGraphNode): EditorModel {
  // arrays are edited as javascript (and eval:ed during runtime)
  // we are not going to add any extra typings here.
  if (options.type === 'array') {
    return new EditorModel(monaco.editor.createModel(options.value, 'typescript'));
  }

  const modules: TypescriptModule[] = [];

  if (['javascript', 'typescript'].includes(options.codeeditor)) {
    const runtimeType = getNodeGraphNodeRuntimeType(node);

    if (node.typename !== 'Expression') {
      modules.push(GetOrCreateViewerModel());
    }

    const defaultLibs: string[] = [];

    switch (runtimeType) {
      case RuntimeType.Browser:
        modules.push(GetOrCreateViewerReactModel());
        break;

      case RuntimeType.Cloud:
        modules.push(GetOrCreateViewerCloudModel());
        break;
    }

    switch (node.typename) {
      case 'DbCollection2':
        modules.push(registerOrUpdate_DbCollection2(node));
        break;

      case 'Expression':
        modules.push(registerOrUpdate_Expression());
        break;

      case 'JavaScriptFunction':
        modules.push(registerOrUpdate_JavaScriptFunction(node, runtimeType));
        break;

      case 'Javascript2':
        modules.push(registerOrUpdate_Javascript2(node, runtimeType));
        break;

      default:
        switch (runtimeType) {
          case RuntimeType.Browser:
            defaultLibs.push('dom', 'es2020');
            break;

          case RuntimeType.Cloud:
            defaultLibs.push('es2020');
            break;
        }
        break;
    }

    // Get a list of all the available libs
    // this is removing all the DOM typings
    const lib = uniq([...defaultLibs, ...modules.flatMap((x) => x.libs)]);

    const compilerOptions: monaco.languages.typescript.CompilerOptions = {
      target: monaco.languages.typescript.ScriptTarget.ES5,
      lib,
      allowNonTsExtensions: true,
      allowJs: true,
      noImplicitAny: false
    };

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
  }

  const languageId = codeEditorTypeToLanguageId(options.codeeditor);
  const model = monaco.editor.createModel(options.value, languageId);

  return new EditorModel(model, modules);
}

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { filesystem } from '@noodl/platform';

import { getExternalFolderPath } from '@noodl-utils/compilation/build/deploy-index';

import { TypescriptModule } from '../helper';

export function GetOrCreateViewerReactModel(): TypescriptModule {
  const libPathName = 'inmemory://@noodl/viewer/react/global.d.ts';
  const libUri = monaco.Uri.parse(libPathName);

  const pkg = new TypescriptModule();

  // Create model
  const model = monaco.editor.getModel(libUri);
  if (model) {
    pkg.setModel(model);
  } else {
    const loadingSource = '/* loading... */';
    pkg.setExtraLib(monaco.languages.typescript.javascriptDefaults.addExtraLib(loadingSource, libPathName));
    pkg.setModel(monaco.editor.createModel(loadingSource, 'typescript', libUri));
  }

  (async () => {
    const filePath = filesystem.join(getExternalFolderPath(), 'viewer', 'global.d.ts.keep');
    const source = await filesystem.readFile(filePath);
    pkg.setExtraLib(monaco.languages.typescript.javascriptDefaults.addExtraLib(source, libPathName));
    pkg.setSource(source);
  })();

  return pkg;
}

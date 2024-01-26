import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { filesystem } from '@noodl/platform';

import { getExternalFolderPath } from '@noodl-utils/compilation/build/deploy-index';

import { TypescriptModule } from '../helper';

export function GetOrCreateViewerCloudModel(): TypescriptModule {
  const libPathName = 'inmemory://@noodl/viewer/cloud/global.d.ts';
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
    const filePath = filesystem.join(getExternalFolderPath(), 'cloudruntime', 'global.d.ts.keep');
    const source = await filesystem.readFile(filePath);
    pkg.setExtraLib(monaco.languages.typescript.javascriptDefaults.addExtraLib(source, libPathName));
    pkg.setSource(source);
  })();

  return pkg;
}

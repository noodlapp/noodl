const remote = require('@electron/remote');

export default function getDocsEndpoint() {
  const localDocs = remote.getGlobal('useLocalDocs');
  return localDocs ? 'http://localhost:3000' : 'https://noodlapp.github.io/noodl-docs/';
}

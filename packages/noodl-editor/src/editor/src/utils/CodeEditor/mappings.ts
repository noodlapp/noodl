// NOTE: I can't find a built in function for this, but maybe it exists!
const prettyLanguageId = {
  javascript: 'JavaScript',

  // We currently dont have TypeScript,
  // it does provide more annotations though!
  typescript: 'JavaScript',

  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  plaintext: 'Plain Text'
};

const languageIdMapping = {
  // Disable this for now, we have to come up with some nice TS config for this
  // javascript: 'typescript',
  text: 'plaintext'
};

export function prettyLanguage(languageId: string): string {
  return prettyLanguageId[languageId] ?? languageId;
}

export function codeEditorTypeToLanguageId(type: string) {
  return languageIdMapping[type] ?? type ?? 'plaintext';
}

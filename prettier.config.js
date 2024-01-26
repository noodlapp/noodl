/* eslint-env node */
// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  bracketSpacing: true,
  printWidth: 120,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  importOrder: [
    '^react',
    '^@noodl/(.*)$',
    '',
    '^@noodl-types/(.*)$',
    '^@noodl-constants/(.*)$',
    '^@noodl-models/(.*)$',
    '^@noodl-utils/(.*)$',
    '',
    '^@noodl-core-ui/(.*)$',
    '',
    '^[./]'
  ],
  importOrderBuiltinModulesToTop: true,
  importOrderCaseInsensitive: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderMergeDuplicateImports: true,
  importOrderCombineTypeAndValueImports: true,
  importOrderSeparation: false
};

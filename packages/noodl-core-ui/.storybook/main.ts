const path = require('path');
const editorDir = path.join(__dirname, '../../noodl-editor');
const coreLibDir = path.join(__dirname, '../');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/preset-create-react-app',
    '@storybook/addon-measure'
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5'
  },
  webpackFinal: (config) => {
    const destinationPath = path.resolve(__dirname, '../../noodl-editor');
    const addExternalPath = (rules) => {
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (rule.test && RegExp(rule.test).test('.tsx')) {
          if (rule.include?.length) rule.include.push(destinationPath);
          else rule.include = destinationPath;
        } else if (rule.test && RegExp(rule.test).test('.ts')) {
          if (rule.include?.length) rule.include.push(destinationPath);
          else rule.include = destinationPath;
        } else if (rule.oneOf) {
          addExternalPath(rule.oneOf);
        }
      }
    };

    addExternalPath(config.module.rules);

    config.module.rules.push({
      test: /\.ts$/,
      use: [
        {
          loader: require.resolve('ts-loader')
        }
      ]
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      '@noodl-core-ui': path.join(coreLibDir, 'src'),
      '@noodl-hooks': path.join(editorDir, 'src/editor/src/hooks'),
      '@noodl-utils': path.join(editorDir, 'src/editor/src/utils'),
      '@noodl-models': path.join(editorDir, 'src/editor/src/models'),
      '@noodl-constants': path.join(editorDir, 'src/editor/src/constants'),
      '@noodl-contexts': path.join(editorDir, 'src/editor/src/contexts'),
      '@noodl-types': path.join(editorDir, 'src/editor/src/types'),
      '@noodl-views': path.join(editorDir, 'src/editor/src/views')
    };

    return config;
  }
};

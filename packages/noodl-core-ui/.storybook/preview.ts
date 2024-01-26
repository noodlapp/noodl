import '../src/styles/custom-properties/fonts.css';
import '../src/styles/custom-properties/colors.css';
import '../src/styles/custom-properties/animations.css';
import '../src/styles/global.css';
import { themes } from '@storybook/theming';

// Setup the platform before anything else is loading
// This is a problem since we are calling the platform when importing
import '@noodl/platform';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  },
  docs: {
    theme: themes.dark
  }
};

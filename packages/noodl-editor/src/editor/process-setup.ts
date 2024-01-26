/* eslint-disable */
/*
  This file is added to .prettierignore too!

  It is very important that the steps in here are done in the right order.
*/

// Setup the platform before anything else is loading
// This is a problem since we are calling the platform when importing
import '@noodl/platform-electron';

// Setup the tracker to send to Mixpanel,
// Very important that this is before anything else.
import './src/utils/tracker';

import './src/utils/bugtracker';

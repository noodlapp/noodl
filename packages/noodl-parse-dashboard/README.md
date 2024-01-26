This package makes it easier to bundle Parse Dashboard with Noodl.

This repo contains:

- A custom `package.json` with the dependencies that are required by the express app version of the dashboard
- A copy of the `Parse-Dashboard` folder from `/deps/parse-dashboard`, which is the code for the Parse express app. Please don't modify the files in here directly. Update `/deps/parse-dashboard`, push, and then copy the files over here.

The files for the Parse Dashboard app itself (e.g. react components, css, icons etc) is built in `/deps/parse-dashboard` and then copied over to `/packages/noodl-editor/src/editor/parse-dashboard-public`

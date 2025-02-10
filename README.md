# Fluxscape

Fluxscape is a low-code platform where designers and developers build custom applications and experiences. Designed as a visual programming environment, it aims to expedite your development process. It promotes the swift and efficient creation of applications, requiring minimal coding knowledge.

## Documentation
Documentation for how to use Fluxscape can be found here:
[Fluxscape Documentation](https://docs.fluxscape.io)

## Community
Main support channel is Discord: [Fluxscape Discord](https://discord.gg/fXNW9EXa6A)

## Download releases
Pre-built binaries can be [downloaded from Github](https://github.com/fluxscape/fluxscape/releases)

## Note for users who are migrating from the deprecated closed source version
- [Migrating the project files and workspaces to a Git provider](https://docs.fluxscape.io/docs/guides/collaboration/migrating-from-noodl-hosted-git/)
- [Migrate backend and database](https://docs.fluxscape.io/docs/guides/deploy/using-an-external-backend/#migrating-from-a-noodl-cloud-service)
- [Self-host frontend](https://docs.fluxscape.io/docs/guides/deploy/hosting-frontend/)

## Building from source

```bash
# Install all dependencies
$ npm install

# Start the Fluxscape Editor and build a production version of the cloud and react runtime (useful when running Fluxscape from source but want to deploy to production)
$ npm start

# Start the Fluxscape Editor and watch the filesystem for changes to the runtimes. Development versions of the runtimes, not meant for production (mostly due to source maps and file size)
# This is ideal for a quick workflow when doing changes on the runtimes.
$ npm run dev

# Start Fluxscape Editor test runner
$ npm run test:editor
```

## Licenses
This repository contains two different licenses for different parts of the Fluxscape platform.

- Components related to the editor, used to edit Fluxscape projects, are under GPLv3
- Components related to the end applications, used by the applications Fluxscape deploys, are under MIT

All of the source code of applications created with Fluxscape are under MIT. This means you can do project specific changes to the runtime without having to redistribute your changes.

Packaged licensed under MIT:
- `noodl-runtime`
- `noodl-viewer-cloud`
- `noodl-viewer-react`
  
You can find a MIT LICENSE file in each of these packages. The rest of the repository is licensed under GPLv3.

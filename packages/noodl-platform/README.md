# Noodl Platform

Cross platform implementation of platform specific features.

## Getting Started

When the app is starting we have to set the desired providers.

### Electron

```ts
// Setup the platform before anything else is loading
// This is a problem since we are calling the platform when importing
import "@noodl/platform-electron";

// Then import the platform etc via:
import { filesystem, platform } from "@noodl/platform";
```

### Node

```
$ npm install @noodl/platform @noodl/platform-node
```

```ts
// Setup the platform before anything else is loading
// This is a problem since we are calling the platform when importing
import "@noodl/platform-node";

// Then import the platform etc via:
import { filesystem, platform } from "@noodl/platform";
```

## Features

### Platform

```ts
import { platform } from "@noodl/platform";

platform.getBuildNumber().then((version) => {});
```

### File System

```ts
import { filesystem } from "@noodl/platform";

filesystem.readJson("path/to/file.json").then((content) => {
  console.log(content.value);
});
```

### Storage (Config Storage)

> This API still needs some love to bring a better universal config system to Noodl.

```ts
import { JSONStorage } from "@noodl/platform";

JSONStorage.get("my-key").then((content) => {
  // content = json file
});

JSONStorage.set("my-key", { key: "value" }).then(() => {
  // done
});

JSONStorage.remove("my-key").then(() => {
  // done
});
```

import path from "path";
import { execSync } from "child_process";

const CWD = path.join(__dirname, "..");
const LOCAL_GIT_DIRECTORY = path.join(
  __dirname,
  "..",
  "node_modules",
  "dugite",
  "git"
);
const LOCAL_GIT_TRAMPOLINE_DIRECTORY = path.join(
  __dirname,
  "..",
  "node_modules",
  "desktop-trampoline/build/Release/desktop-trampoline"
);

console.log("---");
console.log(`> CWD: `, CWD);
console.log(`> LOCAL_GIT_DIRECTORY: `, LOCAL_GIT_DIRECTORY);
console.log(
  `> LOCAL_GIT_TRAMPOLINE_DIRECTORY: `,
  LOCAL_GIT_TRAMPOLINE_DIRECTORY
);
console.log("---");

execSync("npx lerna exec --scope noodl-editor -- npm run test", {
  cwd: CWD,
  stdio: "inherit",
  env: {
    ...process.env,
    LOCAL_GIT_DIRECTORY,
    LOCAL_GIT_TRAMPOLINE_DIRECTORY,
  },
});

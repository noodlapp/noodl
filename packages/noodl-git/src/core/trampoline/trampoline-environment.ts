import { trampolineServer } from "./trampoline-server";
import { withTrampolineToken } from "./trampoline-tokens";
import { TrampolineCommandIdentifier } from "../trampoline/trampoline-command";
import { getDesktopTrampolinePath } from "../../paths";

/**
 * Allows invoking a function with a set of environment variables to use when
 * invoking a Git subcommand that needs to use the trampoline (mainly git
 * operations requiring an askpass script) and with a token to use in the
 * trampoline server.
 *
 * @param fn        Function to invoke with all the necessary environment
 *                  variables.
 */
export async function withTrampolineEnv<T>(
  fn: (env: Object) => Promise<T>
): Promise<T> {
  return withTrampolineToken(async (token) => {
    const desktopTrampolinePath = getDesktopTrampolinePath();
    const desktopPort = await trampolineServer.getPort();

    const result = await fn({
      GIT_ASKPASS: desktopTrampolinePath,
      DESKTOP_PORT: desktopPort,
      DESKTOP_TRAMPOLINE_TOKEN: token,
      DESKTOP_TRAMPOLINE_IDENTIFIER: TrampolineCommandIdentifier.AskPass,
    });

    return result;
  });
}

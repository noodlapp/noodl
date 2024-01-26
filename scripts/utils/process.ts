import { ChildProcess } from "child_process";

export enum ConsoleColor {
  Reset = "\x1b[0m",
  Bright = "\x1b[1m",
  Dim = "\x1b[2m",
  Underscore = "\x1b[4m",
  Blink = "\x1b[5m",
  Reverse = "\x1b[7m",
  Hidden = "\x1b[8m",

  FgBlack = "\x1b[30m",
  FgRed = "\x1b[31m",
  FgGreen = "\x1b[32m",
  FgYellow = "\x1b[33m",
  FgBlue = "\x1b[34m",
  FgMagenta = "\x1b[35m",
  FgCyan = "\x1b[36m",
  FgWhite = "\x1b[37m",

  BgBlack = "\x1b[40m",
  BgRed = "\x1b[41m",
  BgGreen = "\x1b[42m",
  BgYellow = "\x1b[43m",
  BgBlue = "\x1b[44m",
  BgMagenta = "\x1b[45m",
  BgCyan = "\x1b[46m",
  BgWhite = "\x1b[47m",
}

export interface AttachStdioOptions {
  prefix?: string;
  color?: ConsoleColor;
}

class OutputBuffer {
  private _buffer = "";

  public exec(value: string): string[] {
    this._buffer += value;

    const lines = this._buffer.split("\n");
    if (lines.length > 1) {
      const rows = lines.splice(0, lines.length - 1).map((line) => {
        return line.replaceAll("\x1Bc", ""); // Remove all clear screen codes
      });

      this._buffer = lines.at(-1) as string;
      return rows;
    }

    return [];
  }
}

export function attachStdio(
  process: ChildProcess,
  { prefix, color = ConsoleColor.FgCyan }: AttachStdioOptions
) {
  const prefixText = `${color}${prefix}${ConsoleColor.Reset}:`;
  const output = new OutputBuffer();

  process.stdout?.on("data", function (data) {
    const lines = output.exec(data.toString());
    lines.forEach((line) => {
      console.log(prefixText, line);
    });
  });

  process.stderr?.on("data", function (data) {
    const lines = output.exec(data.toString());
    lines.forEach((line) => {
      console.log(prefixText, line);
    });
  });

  process.on("exit", function (code) {
    console.log(prefixText, "process exited with code " + code?.toString());
  });

  return process;
}

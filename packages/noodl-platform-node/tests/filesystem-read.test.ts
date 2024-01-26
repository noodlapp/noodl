import { describe, expect } from "@jest/globals";

import { FileSystemNode } from "../src/filesystem-node";

describe("File System", function () {
  it("readFile: text.txt", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/file_types/text.txt"
    );

    // act
    const content = await filesystem.readFile(sourcePath);

    // assert
    expect(content).toBe("Hello World");
  });

  it("readFile not found", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/file_types/not_found.txt"
    );

    // act & assert
    await expect(() => filesystem.readFile(sourcePath)).rejects.toThrow();
  });

  it("readJson: json.json", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/file_types/json.json"
    );

    // act
    const content = await filesystem.readJson(sourcePath);

    // assert
    expect(content).toEqual({ hello: "world" });
  });

  it("readJson not found", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/file_types/not_found.json"
    );

    // act & assert
    await expect(() => filesystem.readJson(sourcePath)).rejects.toThrow();
  });
});

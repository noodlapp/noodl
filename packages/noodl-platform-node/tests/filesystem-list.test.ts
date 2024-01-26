import { describe, expect } from "@jest/globals";

import { FileSystemNode } from "../src/filesystem-node";

describe("File System", function () {
  it("isDirectoryEmpty: false", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/list_tests/folder1"
    );

    // act
    const isEmpty = await filesystem.isDirectoryEmpty(sourcePath);

    // assert
    expect(isEmpty).toBeFalsy();
  });

  it("isDirectoryEmpty: true", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/empty_folder"
    );

    // We cant save empty folders in git
    await filesystem.makeDirectory(sourcePath);

    // act
    const isEmpty = await filesystem.isDirectoryEmpty(sourcePath);

    // assert
    expect(isEmpty).toBeTruthy();
  });

  it("listDirectory", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/list_tests"
    );

    // act
    const items = await filesystem.listDirectory(sourcePath);

    // assert
    expect(items.length).toBe(3);
    expect(items[0].name).toBe("file2.txt");
    expect(items[0].isDirectory).toBe(false);
    expect(items[1].name).toBe("folder1");
    expect(items[1].isDirectory).toBe(true);
    expect(items[2].name).toBe("folder2");
    expect(items[2].isDirectory).toBe(true);
  });

  it("listDirectoryFiles", async function () {
    // arrange
    const filesystem = new FileSystemNode();
    const sourcePath = filesystem.join(
      process.cwd(),
      "/tests/testfs/list_tests"
    );

    // act
    let items = await filesystem.listDirectoryFiles(sourcePath);
    items = items.sort((a, b) => (a.name > b.name ? 1 : -1));

    // assert
    expect(items.length).toBe(4);
    expect(items[0].name).toBe("file1.txt");
    expect(items[0].isDirectory).toBe(false);
    expect(items[1].name).toBe("file2.txt");
    expect(items[1].isDirectory).toBe(false);
    expect(items[2].name).toBe("file3.txt");
    expect(items[2].isDirectory).toBe(false);
    expect(items[3].name).toBe("file4.txt");
    expect(items[3].isDirectory).toBe(false);
  });
});

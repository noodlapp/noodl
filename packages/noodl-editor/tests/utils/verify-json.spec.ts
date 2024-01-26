import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { verifyJsonFile } from '../../src/editor/src/utils/verifyJson';

describe('Verify json', () => {
  let jsonFilePath, testDirectory;

  beforeEach(async () => {
    testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'noodl-json-verify-test-'));
    jsonFilePath = path.join(testDirectory, 'json-file.json');
  });

  afterEach(async () => {
    await fs.rmdir(testDirectory, { recursive: true });
  });

  it('verifies a valid json file', async () => {
    await fs.writeFile(jsonFilePath, JSON.stringify({ a: 1, b: 2, c: 3 }));
    expect(await verifyJsonFile(jsonFilePath)).toBe(true);
  });

  it("rejects a file that doesn't exist", async () => {
    expect(await verifyJsonFile('dinmamma.lololol')).toBe(false);
  });

  it('rejects a file with invalid json', async () => {
    await fs.writeFile(jsonFilePath, 'invalid json');
    expect(await verifyJsonFile(jsonFilePath)).toBe(false);
  });
});

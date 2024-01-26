import path from 'path';
import { git } from './client';
import { setConfigValue } from './config';
import { DEFAULT_BRANCH } from '../constants';

export async function installMergeDriver(repositoryDir: string) {
  const driverPath = process.env.devMode
    ? `"${path.join(process.cwd(), 'electron')}"` + ' ' + `"${process.cwd()}"`
    : `"${process.env.exePath}"`;

  const driver = `${driverPath} --merge %O %A %B %L`;
  await setConfigValue(
    repositoryDir,
    'merge.noodl.name',
    'Merge driver installed by Noodl to handle merge conflicts in project.json file.'
  );
  await setConfigValue(repositoryDir, 'merge.noodl.driver', driver);
}

export interface InitOptions {
  bare?: boolean;
}

export async function init(repositoryDir: string, options?: InitOptions): Promise<string> {
  const args = ['-c', `init.defaultBranch=${DEFAULT_BRANCH}`, 'init'];

  if (options?.bare) {
    args.push('--bare');
  }

  await git(args, repositoryDir, 'init');

  return repositoryDir;
}

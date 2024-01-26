import { git } from './client';

export async function addAll(basePath: string) {
  await git(['add', '-A'], basePath, 'addAll');
}

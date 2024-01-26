import { git } from './client';

export async function refhead(basePath: string) {
  const { output } = await git(['rev-parse', 'HEAD'], basePath, 'refhead');

  return output.toString().replace(/[\r\n]/g, '');
}

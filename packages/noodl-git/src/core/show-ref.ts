import { git } from './client';

export async function getRefHeads(repositoryDir: string): Promise<Map<string, string>> {
  const args = ['show-ref', '--heads', '-d'];

  const tags = await git(args, repositoryDir, 'getRefHeads', {
    successExitCodes: new Set([0, 1]) // when there are no tags, git exits with 1.
  });

  const tagsArray: Array<[string, string]> = tags.output
    .toString()
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const [commitSha, rawTagName] = line.split(' ');

      // Normalize tag names by removing the leading ref/tags/ and the trailing ^{}.
      //
      // git show-ref returns two entries for annotated tags:
      // deadbeef refs/tags/annotated-tag
      // de510b99 refs/tags/annotated-tag^{}
      //
      // The first entry sha correspond to the blob object of the annotation, while the second
      // entry corresponds to the actual commit where the tag was created.
      // By normalizing the tag name we can make sure that the commit sha gets stored in the returned
      // Map of commits (since git will always print the entry with the commit sha at the end).
      const headName = rawTagName.replace(/^refs\/heads\//, '').replace(/\^\{\}$/, '');

      return [headName, commitSha];
    });

  return new Map(tagsArray);
}

export async function getAllTags(repositoryDir: string): Promise<Map<string, string>> {
  const args = ['show-ref', '-d'];

  const tags = await git(args, repositoryDir, 'getAllTags', {
    successExitCodes: new Set([0, 1]) // when there are no tags, git exits with 1.
  });

  const tagsArray: Array<[string, string]> = tags.output
    .toString()
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const [commitSha, rawTagName] = line.split(' ');
      return [rawTagName, commitSha];
    });

  return new Map(tagsArray);
}

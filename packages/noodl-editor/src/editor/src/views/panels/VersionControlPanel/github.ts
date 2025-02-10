export function convertGitRemoteUrlToRepoUrl(gitRemoteUrl: string): string {
  // Remove the .git extension if present
  gitRemoteUrl = gitRemoteUrl.replace(/\.git$/, '');

  // Extract the repository name and owner from the URL
  const regex = /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)$/;
  const match = gitRemoteUrl.match(regex);

  if (match) {
    const owner = match[1];
    const repo = match[2];
    // Construct the GitHub repository URL
    const repoUrl = `https://github.com/${owner}/${repo}`;
    return repoUrl;
  } else {
    throw new Error('Invalid GitHub Git remote URL');
  }
}

export function convertGitRemoteUrlToCommitUrl(gitRemoteUrl: string, commitSha: string): string {
  const githubLink = convertGitRemoteUrlToRepoUrl(gitRemoteUrl);
  return `${githubLink}/commit/${commitSha}`;
}

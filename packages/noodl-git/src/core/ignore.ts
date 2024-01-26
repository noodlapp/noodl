import path from 'path';
import fs from 'fs';

export async function appendGitIgnore(repositoryDir: string, newItems: string[]) {
  const gitIgnorePath = path.join(repositoryDir, '.gitignore');
  const content = fs.existsSync(gitIgnorePath) ? await fs.promises.readFile(gitIgnorePath, { encoding: 'utf-8' }) : '';
  const lineByLine = content.split('\n').map((x) => x.trim());

  const newContent = [];
  newItems.forEach((text) => {
    if (!lineByLine.includes(text)) {
      newContent.push(text);
    }
  });

  if (newContent.length > 0) {
    await fs.promises.appendFile(gitIgnorePath, newContent.join('\r\n') + '\r\n');
  }
}

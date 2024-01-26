import path from 'path';
import fs from 'fs';

export async function appendGitAttributes(repositoryDir: string, newItems: string[]) {
  const gitAttributesPath = path.join(repositoryDir, '.gitattributes');
  const content = fs.existsSync(gitAttributesPath)
    ? await fs.promises.readFile(gitAttributesPath, { encoding: 'utf-8' })
    : '';
  const lineByLine = content.split('\n').map((x) => x.trim());

  const newContent = [];
  newItems.forEach((text) => {
    if (!lineByLine.includes(text)) {
      newContent.push(text);
    }
  });

  if (newContent.length > 0) {
    await fs.promises.appendFile(gitAttributesPath, newContent.join('\r\n') + '\r\n');
  }
}

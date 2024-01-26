import { IMergeTreeEntry, MergeTreeError } from './core/models/merge';
import { getFileContents } from './core/cat-file';
import { addAll } from './core/add';

import path from 'path';
import fs from 'fs';

function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

type JSON_OBJECT = {
  [key: string]: any;
};

/** Merge the project.json file */
export type MergeStrategyFunc = (ancestors: JSON_OBJECT, ours: JSON_OBJECT, theirs: JSON_OBJECT) => JSON_OBJECT;

/**
 * Defines the Noodl custom merge strategy.
 */
export class MergeStrategy {
  constructor(
    public readonly repositoryDir: string,
    private readonly mergeProject: MergeStrategyFunc,
    public readonly strategy: 'our' | 'their' = 'our'
  ) {}

  public async solveConflicts(tree: MergeTreeError) {
    const projectJsonFiles = new Set<IMergeTreeEntry>(); //handle repos with multiple noodl projects
    const otherFiles = new Set<IMergeTreeEntry>();

    for (const entry of tree.conflictedEntries) {
      if (entry.hasConflicts) {
        const parent = entry.base || entry.our || entry.their;
        if (parent.path === 'project.json' || parent.path.slice(-13) === '/project.json') {
          projectJsonFiles.add(entry);
        } else {
          otherFiles.add(entry);
        }
      }
    }

    // Resolve conflicts
    const projectPromises = Array.from(projectJsonFiles).map((x) => this.resolveProjectJsonConflict(x));
    const otherFilePromises = Array.from(otherFiles).map((x) => this.resolveFileConflict(x));

    const allPromises = [...projectPromises, ...otherFilePromises];
    await Promise.all(allPromises);

    // Mark all the file as resolved resolution
    await addAll(this.repositoryDir);

    // Return all files that were resolved
    return [...projectJsonFiles, ...otherFiles];
  }

  private async resolveFileConflict(entry: IMergeTreeEntry) {
    const parent = entry.base || entry.our || entry.their;
    console.log('resolveFileConflict', parent.path);

    const targetEntry = entry[this.strategy];
    console.log('vcs: resolving file conflict', targetEntry.path, 'using', this.strategy);
    const ourBlob = await getFileContents(this.repositoryDir, targetEntry.sha);

    const absolutePath = path.join(this.repositoryDir, parent.path);
    // Write our version of the file
    await fs.promises.writeFile(absolutePath, ourBlob);
  }

  private async resolveProjectJsonConflict(entry: IMergeTreeEntry) {
    const parent = entry.base || entry.our || entry.their;
    console.log('resolveProjectJsonConflict', parent.path);

    const results = await Promise.all([
      entry.base ? getFileContents(this.repositoryDir, entry.base.sha) : Promise.resolve('{}'),
      entry.our ? getFileContents(this.repositoryDir, entry.our.sha) : Promise.resolve('{}'),
      entry.their ? getFileContents(this.repositoryDir, entry.their.sha) : Promise.resolve('{}')
    ]);

    const ancestor = tryParseJson(results[0].toString());
    const ours = tryParseJson(results[1].toString());
    const theirs = tryParseJson(results[2].toString());

    if (!ancestor) {
      throw new Error("Failed to solve project.json conflict. Couldn't parse ancestor: " + results[0].toString());
    }
    if (!ours) {
      throw new Error("Failed to solve project.json conflict. Couldn't parse ours: " + results[1].toString());
    } else if (!theirs) {
      throw new Error("Failed to solve project.json conflict. Couldn't parse theirs: " + results[2].toString());
    }

    const mergedResult = this.mergeProject(ancestor, ours, theirs);

    const absolutePath = path.join(this.repositoryDir, parent.path);
    await fs.promises.writeFile(absolutePath, JSON.stringify(mergedResult));
  }
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const diff = require('diff');
const prompts = require('prompts');
const pc = require('picocolors');

const args = process.argv.slice(2);
const overrideAll = args.includes('--override');

// The package directory
const sourceDir = path.resolve(__dirname, '../skills');
// The user's cwd
const targetDir = path.resolve(process.cwd(), '.agents/skills');

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function start() {
  if (!fs.existsSync(sourceDir)) {
    console.error(pc.red(`Error: Source directory not found at ${sourceDir}`));
    process.exit(1);
  }

  const allSourceFiles = await getFiles(sourceDir);

  for (const srcFile of allSourceFiles) {
    const relativePath = path.relative(sourceDir, srcFile);
    // User requested "copy them into the current working directory".
    // Typically they just get copied direct into `.agents/skills` relative to CWD.
    const destFile = path.resolve(targetDir, relativePath);

    const destDir = path.dirname(destFile);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    if (!fs.existsSync(destFile)) {
      console.log(pc.green(`Creating: .agents/skills/${relativePath}`));
      fs.copyFileSync(srcFile, destFile);
      continue;
    }

    // File already exists
    const srcContent = fs.readFileSync(srcFile, 'utf8');
    const destContent = fs.readFileSync(destFile, 'utf8');

    if (srcContent === destContent) {
      console.log(pc.gray(`Skipped (identical): .agents/skills/${relativePath}`));
      continue;
    }

    if (overrideAll) {
      console.log(pc.yellow(`Overriding: .agents/skills/${relativePath}`));
      fs.copyFileSync(srcFile, destFile);
      continue;
    }

    console.log(pc.cyan(`\nDiff for .agents/skills/${relativePath}:`));
    const diffResult = diff.diffLines(destContent, srcContent);

    diffResult.forEach((part) => {
      const color = part.added ? pc.green :
                    part.removed ? pc.red : pc.gray;
      const prefix = part.added ? '+ ' :
                     part.removed ? '- ' : '  ';

      const lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') lines.pop();

      lines.forEach(line => {
        console.log(color(`${prefix}${line}`));
      });
    });

    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: `Overwrite .agents/skills/${relativePath}?`,
      initial: false
    });

    if (response.value) {
      console.log(pc.yellow(`Overriding: .agents/skills/${relativePath}`));
      fs.copyFileSync(srcFile, destFile);
    } else {
      console.log(pc.gray(`Skipped: .agents/skills/${relativePath}`));
    }
  }

  console.log(pc.green('\nDone copying skills!'));
}

start().catch(err => {
  console.error(pc.red('An error occurred:'), err);
  process.exit(1);
});

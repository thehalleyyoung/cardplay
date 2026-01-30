#!/usr/bin/env ts-node
/**
 * print-repo-map.ts
 * Outputs a stable tree snapshot of the repository for LLM context
 * 
 * Change 042 from to_fix_repo_plan_500.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');

const IGNORE_PATTERNS = [
  /^node_modules$/,
  /^\.git$/,
  /^dist$/,
  /^coverage$/,
  /^\.DS_Store$/,
  /\.tsbuildinfo$/,
  /^test-output$/,
];

const IMPORTANT_DIRS = [
  'src',
  'docs/canon',
  'scripts',
];

interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
}

function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(name));
}

function buildTree(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): TreeNode[] {
  if (currentDepth >= maxDepth) {
    return [];
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes: TreeNode[] = [];
  
  for (const entry of entries) {
    if (shouldIgnore(entry.name)) {
      continue;
    }
    
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      const children = buildTree(fullPath, maxDepth, currentDepth + 1);
      nodes.push({
        name: entry.name,
        type: 'dir',
        children: children.length > 0 ? children : undefined
      });
    } else if (entry.isFile()) {
      nodes.push({
        name: entry.name,
        type: 'file'
      });
    }
  }
  
  // Sort: directories first, then files, alphabetically within each group
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  return nodes;
}

function printTree(nodes: TreeNode[], prefix: string = '', isLast: boolean = true): string {
  let output = '';
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLastChild = i === nodes.length - 1;
    const connector = isLastChild ? '└── ' : '├── ';
    const newPrefix = prefix + (isLastChild ? '    ' : '│   ');
    
    const icon = node.type === 'dir' ? '📁' : '📄';
    output += `${prefix}${connector}${icon} ${node.name}\n`;
    
    if (node.children && node.children.length > 0) {
      output += printTree(node.children, newPrefix, isLastChild);
    }
  }
  
  return output;
}

function main(): void {
  console.log('Repository Map');
  console.log('==============\n');
  
  const tree = buildTree(ROOT, 4);
  const treeStr = printTree(tree);
  
  console.log(treeStr);
  
  console.log('\nImportant directories:');
  for (const dir of IMPORTANT_DIRS) {
    const fullPath = path.join(ROOT, dir);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        const fileCount = countFiles(fullPath);
        console.log(`  - ${dir}: ${fileCount} files`);
      }
    }
  }
  
  console.log();
}

function countFiles(dirPath: string): number {
  let count = 0;
  
  function traverse(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) {
        continue;
      }
      
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()) {
        count++;
      }
    }
  }
  
  traverse(dirPath);
  return count;
}

main();

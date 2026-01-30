#!/usr/bin/env tsx
/**
 * Shared codemod runner using ts-morph for bulk renames and transformations.
 * Change 021 — Add shared codemod runner for bulk renames.
 */

import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import { resolve } from 'path';

export interface CodemodOptions {
  projectRoot?: string;
  tsConfigPath?: string;
  dryRun?: boolean;
  include?: string[];
  exclude?: string[];
}

export interface CodemodResult {
  filesModified: number;
  filesScanned: number;
  errors: Array<{ file: string; error: string }>;
}

export type CodemodTransform = (sourceFile: SourceFile) => boolean;

export class CodemodRunner {
  private project: Project;
  private options: Required<CodemodOptions>;

  constructor(options: CodemodOptions = {}) {
    this.options = {
      projectRoot: options.projectRoot || resolve(__dirname, '../..'),
      tsConfigPath: options.tsConfigPath || resolve(__dirname, '../../tsconfig.json'),
      dryRun: options.dryRun ?? false,
      include: options.include || ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: options.exclude || ['node_modules/**', 'dist/**', '**/*.test.ts', '**/*.spec.ts'],
    };

    this.project = new Project({
      tsConfigFilePath: this.options.tsConfigPath,
      skipAddingFilesFromTsConfig: false,
    });
  }

  /**
   * Run a transformation function across all matching source files.
   */
  async run(name: string, transform: CodemodTransform): Promise<CodemodResult> {
    console.log(`\n🔄 Running codemod: ${name}`);
    console.log(`   Project root: ${this.options.projectRoot}`);
    console.log(`   Dry run: ${this.options.dryRun}`);

    const result: CodemodResult = {
      filesModified: 0,
      filesScanned: 0,
      errors: [],
    };

    const sourceFiles = this.project.getSourceFiles();
    console.log(`   Found ${sourceFiles.length} source files`);

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      
      // Skip excluded files
      if (this.options.exclude.some(pattern => this.matchesGlob(filePath, pattern))) {
        continue;
      }

      // Skip files not in include list
      if (this.options.include.length > 0 && 
          !this.options.include.some(pattern => this.matchesGlob(filePath, pattern))) {
        continue;
      }

      result.filesScanned++;

      try {
        const modified = transform(sourceFile);
        if (modified) {
          result.filesModified++;
          if (!this.options.dryRun) {
            await sourceFile.save();
          }
          console.log(`   ✅ Modified: ${this.getRelativePath(filePath)}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push({ file: filePath, error: errorMsg });
        console.error(`   ❌ Error in ${this.getRelativePath(filePath)}: ${errorMsg}`);
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   Files scanned: ${result.filesScanned}`);
    console.log(`   Files modified: ${result.filesModified}`);
    console.log(`   Errors: ${result.errors.length}`);

    if (this.options.dryRun && result.filesModified > 0) {
      console.log(`\n⚠️  Dry run mode - no changes were written`);
    }

    return result;
  }

  private matchesGlob(filePath: string, pattern: string): boolean {
    // Simple glob matching (could be enhanced with a library like minimatch)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(regexPattern).test(filePath);
  }

  private getRelativePath(filePath: string): string {
    return filePath.replace(this.options.projectRoot + '/', '');
  }
}

/**
 * Utility functions for common codemod operations
 */
export const CodemodUtils = {
  /**
   * Rename all occurrences of a type/interface/class
   */
  renameTypeDeclaration(sourceFile: SourceFile, oldName: string, newName: string): boolean {
    let modified = false;

    // Rename interface declarations
    sourceFile.getInterfaces().forEach(iface => {
      if (iface.getName() === oldName) {
        iface.rename(newName);
        modified = true;
      }
    });

    // Rename type alias declarations
    sourceFile.getTypeAliases().forEach(typeAlias => {
      if (typeAlias.getName() === oldName) {
        typeAlias.rename(newName);
        modified = true;
      }
    });

    // Rename class declarations
    sourceFile.getClasses().forEach(cls => {
      if (cls.getName() === oldName) {
        cls.rename(newName);
        modified = true;
      }
    });

    return modified;
  },

  /**
   * Update import specifiers
   */
  updateImportSpecifier(sourceFile: SourceFile, moduleName: string, oldImport: string, newImport: string): boolean {
    let modified = false;

    sourceFile.getImportDeclarations().forEach(importDecl => {
      if (importDecl.getModuleSpecifierValue().includes(moduleName)) {
        importDecl.getNamedImports().forEach(namedImport => {
          if (namedImport.getName() === oldImport) {
            namedImport.renameAlias(newImport);
            modified = true;
          }
        });
      }
    });

    return modified;
  },

  /**
   * Replace string literal values
   */
  replaceStringLiteral(sourceFile: SourceFile, oldValue: string, newValue: string): boolean {
    let modified = false;

    sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach(literal => {
      if (literal.getLiteralValue() === oldValue) {
        literal.setLiteralValue(newValue);
        modified = true;
      }
    });

    return modified;
  },
};

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    ignores: ['**/*.test.ts', '**/*.bench.test.ts', '**/*.e2e.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Core rules
      'no-console': 'off',
      'no-debugger': 'warn',
      
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.bench.test.ts', '**/*.e2e.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Core rules
      'no-console': 'off',
      'no-debugger': 'warn',
      
      // TypeScript-specific rules - more relaxed for tests
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.config.ts', '*.config.js'],
  },
];

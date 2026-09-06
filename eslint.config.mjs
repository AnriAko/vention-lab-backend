import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            '**/dist',
            '**/node_modules',
            '**/generated/**',
            '**/jest.config.ts',
            'eslint.config.mjs',
            'apps/*/eslint.config.mjs',
        ],
    },

    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,

    {
        files: ['apps/main/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'module',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ['apps/file-process/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'module',
            parserOptions: {
                project: ['./apps/file-process/tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ['apps/rag/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'module',
            parserOptions: {
                project: ['./apps/rag/tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ['packages/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'module',
            parserOptions: {
                project: [
                    './packages/shared/logger/tsconfig.json',
                    './packages/shared/rabbitmq/tsconfig.json',
                    './packages/shared/firebase/tsconfig.json',
                    './packages/shared/file-storage/tsconfig.json',
                    './packages/shared/qdrant/tsconfig.json',
                    './packages/contracts/file-process/tsconfig.json',
                    './packages/contracts/rag/tsconfig.json',
                    './packages/contracts/generation/tsconfig.json',
                ],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ['apps/main/test/**/*.ts', 'apps/**/*.spec.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            'prettier/prettier': ['error', { endOfLine: 'auto' }],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
        },
    }
);

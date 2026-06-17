import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist', 'node_modules', 'eslint.config.mjs'],
    },

    eslint.configs.recommended,

    ...tseslint.configs.recommendedTypeChecked,

    eslintPluginPrettierRecommended,

    // -----------------------------
    // BASE TS PROJECT (src)
    // -----------------------------
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            sourceType: 'module',
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    // -----------------------------
    // TESTS (jest + spec + e2e)
    // -----------------------------
    {
        files: ['test/**/*.ts', 'src/**/*.spec.ts', 'src/**/*.e2e-spec.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: 'module',
            parserOptions: {
                project: ['./tsconfig.spec.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    // -----------------------------
    // RULES
    // -----------------------------
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

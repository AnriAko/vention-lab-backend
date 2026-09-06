import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    // ---------------------------------------------------------
    // Global ignores
    // ---------------------------------------------------------
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '**/generated/**',
            '**/coverage/**',
            '**/jest.config.ts',
            'eslint.config.mjs',
            'apps/*/eslint.config.mjs',
        ],
    },

    // ---------------------------------------------------------
    // Base ESLint rules
    // ---------------------------------------------------------
    eslint.configs.recommended,

    // ---------------------------------------------------------
    // TypeScript
    // ---------------------------------------------------------
    {
        files: ['**/*.{ts,tsx}'],

        extends: [...tseslint.configs.recommendedTypeChecked],

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

        rules: {
            '@typescript-eslint/no-explicit-any': 'off',

            '@typescript-eslint/no-floating-promises': 'warn',

            '@typescript-eslint/no-unsafe-argument': 'warn',

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
    },

    // ---------------------------------------------------------
    // JavaScript
    // ---------------------------------------------------------
    {
        files: ['**/*.{js,jsx,mjs,cjs}'],

        languageOptions: {
            globals: {
                ...globals.node,
            },

            sourceType: 'module',
        },

        extends: [tseslint.configs.disableTypeChecked],
    },

    // ---------------------------------------------------------
    // Tests
    // ---------------------------------------------------------
    {
        files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
    },

    // ---------------------------------------------------------
    // Prettier
    // ---------------------------------------------------------
    eslintPluginPrettierRecommended,

    {
        rules: {
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],
        },
    }
);

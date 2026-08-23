import type { Config } from 'jest';

const config: Config = {
    rootDir: '.',
    testEnvironment: 'node',

    moduleFileExtensions: ['js', 'json', 'ts'],

    testRegex: '.*\\.spec\\.ts$',

    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.spec.json',
                useESM: true,
            },
        ],
    },

    moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },

    extensionsToTreatAsEsm: ['.ts'],

    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coverageDirectory: 'coverage',
};

export default config;

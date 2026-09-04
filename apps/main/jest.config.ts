import type { Config } from 'jest';

import base from '../../configs/jest/base.cjs';

const config: Config = {
    ...base,
    rootDir: '.',
    moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/src/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coverageDirectory: 'coverage',
};

export default config;

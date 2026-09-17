/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '.*\\.spec\\.ts$',
    passWithNoTests: true,
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.spec.json',
                useESM: true,
            },
        ],
    },
    extensionsToTreatAsEsm: ['.ts'],
    transformIgnorePatterns: ['node_modules/(?!(chalk)/)'],
};

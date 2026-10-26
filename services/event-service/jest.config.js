export default {
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { diagnostics: false }],
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};

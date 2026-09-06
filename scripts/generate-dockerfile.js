const fs = require('node:fs');
const path = require('node:path');

const { ROOT_DIR, loadWorkspacePackages } = require('./workspace-utils');

const APP_CONFIG = {
    main: {
        buildScript: 'build:main',
        distPath: 'dist',
        entrypoint: 'dist/src/main',
    },

    'file-process': {
        buildScript: 'build:file-process',
        distPath: 'dist',
        entrypoint: 'dist/main',
    },

    rag: {
        buildScript: 'build:rag',
        distPath: 'dist',
        entrypoint: 'dist/main',
    },
};

function getAppName() {
    const appName = process.argv[2];

    if (!appName) {
        throw new Error(
            'App name is required.\n\n' +
                'Usage:\n' +
                '  node scripts/generate-dockerfile.js main\n' +
                '  node scripts/generate-dockerfile.js file-process\n' +
                '  node scripts/generate-dockerfile.js rag'
        );
    }

    if (!APP_CONFIG[appName]) {
        throw new Error(
            `Unknown app "${appName}".\n\n` +
                `Available apps: ${Object.keys(APP_CONFIG).join(', ')}`
        );
    }

    return appName;
}

function generateWorkspaceCopies() {
    const workspacePackages = loadWorkspacePackages();

    return [...workspacePackages.values()]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((workspace) => {
            const relativePath = path
                .relative(ROOT_DIR, workspace.path)
                .replaceAll(path.sep, '/');

            return (
                `COPY ${relativePath}/package.json ` +
                `./${relativePath}/package.json`
            );
        })
        .join('\n');
}

function generateDockerfile(appName, appConfig) {
    const workspaceCopies = generateWorkspaceCopies();

    return `FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

${workspaceCopies}

COPY configs ./configs

RUN npm ci


FROM dependencies AS build

WORKDIR /app

COPY . .

RUN npm run build:packages
RUN npm run ${appConfig.buildScript}


FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/apps/${appName}/${appConfig.distPath} ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/${appName}/package.json ./package.json

CMD ["node", "${appConfig.entrypoint}"]
`;
}

function main() {
    const appName = getAppName();
    const appConfig = APP_CONFIG[appName];

    const dockerfile = generateDockerfile(appName, appConfig);

    const outputPath = path.join(ROOT_DIR, `Dockerfile.${appName}.generated`);

    fs.writeFileSync(outputPath, dockerfile, 'utf8');

    console.log(`Generated Dockerfile for "${appName}":`);
    console.log(path.relative(ROOT_DIR, outputPath));
}

main();

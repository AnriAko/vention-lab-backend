const fs = require('node:fs');
const path = require('node:path');

const {
    ROOT_DIR,
    loadWorkspacePackages,
    getInternalDependencies,
    resolveBuildOrder,
} = require('./workspace-utils');

const APP_CONFIG = {
    main: {
        workspaceName: '@vention/main',
        buildScript: 'build:main',
        distPath: 'dist',
        entrypoint: 'dist/src/main',
    },

    'file-process': {
        workspaceName: '@vention/file-process',
        buildScript: 'build:file-process',
        distPath: 'dist',
        entrypoint: 'dist/main',
    },

    rag: {
        workspaceName: '@vention/rag',
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

function getRelativeWorkspacePath(workspace) {
    return path.relative(ROOT_DIR, workspace.path).replaceAll(path.sep, '/');
}

function getWorkspaceStageName(packageName) {
    return packageName
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .toLowerCase();
}

function generateWorkspaceCopies() {
    const workspacePackages = loadWorkspacePackages();

    return [...workspacePackages.values()]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((workspace) => {
            const relativePath = getRelativeWorkspacePath(workspace);

            return (
                `COPY ${relativePath}/package.json ` +
                `./${relativePath}/package.json`
            );
        })
        .join('\n');
}

function getBuildPackageNames(appConfig) {
    const workspacePackages = loadWorkspacePackages();

    const dependencies = getInternalDependencies(
        appConfig.workspaceName,
        workspacePackages
    );

    return resolveBuildOrder(dependencies, workspacePackages);
}

function getBuildLevels(packageNames, workspacePackages) {
    const levels = new Map();
    const visiting = new Set();

    function getLevel(packageName) {
        if (levels.has(packageName)) {
            return levels.get(packageName);
        }

        if (visiting.has(packageName)) {
            throw new Error(
                `Circular workspace dependency detected: ${packageName}`
            );
        }

        visiting.add(packageName);

        const dependencies = getInternalDependencies(
            packageName,
            workspacePackages
        );

        const level = dependencies.length
            ? Math.max(...dependencies.map(getLevel)) + 1
            : 0;

        visiting.delete(packageName);
        levels.set(packageName, level);

        return level;
    }

    packageNames.forEach(getLevel);

    return [...levels.entries()].reduce((result, [packageName, level]) => {
        const packagesAtLevel = result.get(level) ?? [];

        packagesAtLevel.push(packageName);
        result.set(level, packagesAtLevel);

        return result;
    }, new Map());
}

function generatePackageBuildStages(appConfig) {
    const workspacePackages = loadWorkspacePackages();

    const packageNames = getBuildPackageNames(appConfig);
    const buildLevels = getBuildLevels(packageNames, workspacePackages);

    const stages = [];

    for (const packageNamesAtLevel of buildLevels.values()) {
        for (const packageName of packageNamesAtLevel) {
            const workspace = workspacePackages.get(packageName);

            if (!workspace) {
                throw new Error(`Workspace package "${packageName}" not found`);
            }

            const relativePath = getRelativeWorkspacePath(workspace);
            const stageName = getWorkspaceStageName(packageName);

            const dependencies = getInternalDependencies(
                packageName,
                workspacePackages
            ).filter((dependency) => packageNames.includes(dependency));

            const dependencyCopies = dependencies
                .map((dependency) => {
                    const dependencyWorkspace =
                        workspacePackages.get(dependency);

                    const dependencyPath =
                        getRelativeWorkspacePath(dependencyWorkspace);

                    const dependencyStage = getWorkspaceStageName(dependency);

                    return (
                        `COPY --from=build-${dependencyStage} ` +
                        `/app/${dependencyPath}/dist ` +
                        `./${dependencyPath}/dist`
                    );
                })
                .join('\n');

            stages.push(`
FROM dependencies AS build-${stageName}

WORKDIR /app

COPY ${relativePath} ./${relativePath}
${dependencyCopies ? `\n${dependencyCopies}\n` : ''}
RUN npm run build --workspace=${packageName}
`);
        }
    }

    return stages.join('\n');
}

function generateMainBuildStage(appName, appConfig) {
    const workspacePackages = loadWorkspacePackages();
    const packageNames = getBuildPackageNames(appConfig);

    const dependencyCopies = packageNames
        .map((packageName) => {
            const workspace = workspacePackages.get(packageName);
            const relativePath = getRelativeWorkspacePath(workspace);
            const stageName = getWorkspaceStageName(packageName);

            return (
                `COPY --from=build-${stageName} ` +
                `/app/${relativePath}/dist ` +
                `./${relativePath}/dist`
            );
        })
        .join('\n');

    return `
FROM dependencies AS build

WORKDIR /app

${dependencyCopies}

COPY apps/${appName} ./apps/${appName}

RUN npm run ${appConfig.buildScript}
`;
}

function generateBuiltPackageCopies(appConfig) {
    const workspacePackages = loadWorkspacePackages();
    const packageNames = getBuildPackageNames(appConfig);

    return packageNames
        .map((packageName) => {
            const workspace = workspacePackages.get(packageName);

            const relativePath = getRelativeWorkspacePath(workspace);
            const stageName = getWorkspaceStageName(packageName);

            return (
                `COPY --from=build-${stageName} ` +
                `/app/${relativePath} ` +
                `./${relativePath}`
            );
        })
        .join('\n');
}

function generateDockerfile(appName, appConfig) {
    const workspaceCopies = generateWorkspaceCopies();
    const packageBuildStages = generatePackageBuildStages(appConfig);
    const mainBuildStage = generateMainBuildStage(appName, appConfig);
    const builtPackageCopies = generateBuiltPackageCopies(appConfig);

    return `FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

${workspaceCopies}

COPY configs ./configs

RUN --mount=type=cache,target=/root/.npm npm ci


${packageBuildStages}


${mainBuildStage}


FROM node:22-alpine AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./

${workspaceCopies}

COPY configs ./configs

RUN --mount=type=cache,target=/root/.npm \\
    npm prune --omit=dev --ignore-scripts


FROM production-dependencies AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/${appName}/${appConfig.distPath} ./dist

${builtPackageCopies}

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

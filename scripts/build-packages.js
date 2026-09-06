const { execSync } = require('node:child_process');

const {
    ROOT_DIR,
    loadWorkspacePackages,
    getInternalDependencies,
    resolveBuildOrder,
} = require('./workspace-utils');

const workspacePackages = loadWorkspacePackages();

function build(packageNames) {
    const buildOrder = resolveBuildOrder(packageNames, workspacePackages);

    console.log(
        `\nBuild order:\n${buildOrder
            .map((name, index) => `${index + 1}. ${name}`)
            .join('\n')}\n`
    );

    for (const packageName of buildOrder) {
        console.log(`\n▶ Building ${packageName}\n`);

        execSync(`npm run build --workspace=${packageName}`, {
            cwd: ROOT_DIR,
            stdio: 'inherit',
        });
    }
}

function getAllPackages() {
    return [...workspacePackages.keys()];
}

function getWorkspaceFromArg() {
    const workspaceArg = process.argv.find((arg) =>
        arg.startsWith('--workspace=')
    );

    if (!workspaceArg) {
        return null;
    }

    return workspaceArg.slice('--workspace='.length);
}

const command = process.argv[2];

const workspaceArg = getWorkspaceFromArg();

const packageArgs = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith('--'));

switch (command) {
    case 'dependencies': {
        if (!workspaceArg) {
            throw new Error(
                'Usage: npm run build:dependencies --workspace=@vention/rag'
            );
        }

        const dependencies = getInternalDependencies(
            workspaceArg,
            workspacePackages
        );

        build(dependencies);

        break;
    }

    case 'package': {
        if (packageArgs.length === 0) {
            throw new Error(
                'Usage: npm run build:package -- @vention/shared-logger'
            );
        }

        build(packageArgs);

        break;
    }

    case 'all':
    case undefined: {
        build(getAllPackages());

        break;
    }

    default:
        throw new Error(
            `Unknown command "${command}". ` +
                'Available commands: all, package, dependencies'
        );
}

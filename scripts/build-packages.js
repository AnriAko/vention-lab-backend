const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const {
    ROOT_DIR,
    loadWorkspacePackages,
    getInternalDependencies,
    resolveBuildOrder,
} = require('./workspace-utils');

const workspacePackages = loadWorkspacePackages();
const execFileAsync = promisify(execFile);

function getBuildLevels(packageNames) {
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
        const packageNamesAtLevel = result.get(level) ?? [];

        packageNamesAtLevel.push(packageName);
        result.set(level, packageNamesAtLevel);

        return result;
    }, new Map());
}

async function build(packageNames) {
    const buildOrder = resolveBuildOrder(packageNames, workspacePackages);
    const buildLevels = getBuildLevels(packageNames);

    console.log(
        `\nBuild order:\n${buildOrder.map((name, index) => `${index + 1}. ${name}`).join('\n')}\n`
    );

    for (const packageNamesAtLevel of buildLevels.values()) {
        await Promise.all(
            packageNamesAtLevel.map(async (packageName) => {
                console.log(`\n▶ Building ${packageName}\n`);

                const npmCommand =
                    process.platform === 'win32' ? 'npm.cmd' : 'npm';

                await execFileAsync(
                    npmCommand,
                    ['run', 'build', `--workspace=${packageName}`],
                    {
                        cwd: ROOT_DIR,
                        shell: true,
                        stdio: 'inherit',
                    }
                );
            })
        );
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

async function main() {
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

            await build(dependencies);

            break;
        }

        case 'package': {
            if (packageArgs.length === 0) {
                throw new Error(
                    'Usage: npm run build:package -- @vention/shared-logger'
                );
            }

            await build(packageArgs);

            break;
        }

        case 'all':
        case undefined: {
            await build(getAllPackages());

            break;
        }

        default:
            throw new Error(
                `Unknown command "${command}". ` +
                    'Available commands: all, package, dependencies'
            );
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

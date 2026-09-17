const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = process.cwd();
const ROOT_PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');

function loadRootPackage() {
    return JSON.parse(fs.readFileSync(ROOT_PACKAGE_JSON, 'utf8'));
}

function getWorkspacePatterns() {
    const rootPackage = loadRootPackage();
    const { workspaces } = rootPackage;

    if (!workspaces) {
        throw new Error('No workspaces configured in root package.json');
    }

    if (Array.isArray(workspaces)) {
        return workspaces;
    }

    return [...(workspaces.packages ?? []), ...(workspaces.nohoist ?? [])];
}

function getWorkspacePackagePaths() {
    const patterns = getWorkspacePatterns();
    const packagePaths = [];

    for (const pattern of patterns) {
        if (!pattern.endsWith('/*')) {
            packagePaths.push(path.join(ROOT_DIR, pattern));

            continue;
        }

        const parentDir = path.join(ROOT_DIR, pattern.slice(0, -2));

        if (!fs.existsSync(parentDir)) {
            continue;
        }

        for (const entry of fs.readdirSync(parentDir, {
            withFileTypes: true,
        })) {
            if (!entry.isDirectory()) {
                continue;
            }

            packagePaths.push(path.join(parentDir, entry.name));
        }
    }

    return packagePaths;
}

function loadWorkspacePackages() {
    const packages = new Map();

    for (const packagePath of getWorkspacePackagePaths()) {
        const packageJsonPath = path.join(packagePath, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            continue;
        }

        const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf8')
        );

        if (!packageJson.name) {
            continue;
        }

        packages.set(packageJson.name, {
            name: packageJson.name,
            path: packagePath,
            packageJson,
        });
    }

    return packages;
}

function getInternalDependencies(packageName, workspacePackages) {
    const workspace = workspacePackages.get(packageName);

    if (!workspace) {
        throw new Error(`Workspace package "${packageName}" not found`);
    }

    const {
        dependencies = {},
        devDependencies = {},
        peerDependencies = {},
    } = workspace.packageJson;

    const allDependencies = {
        ...dependencies,
        ...devDependencies,
        ...peerDependencies,
    };

    return Object.keys(allDependencies).filter((dependency) =>
        workspacePackages.has(dependency)
    );
}

function resolveBuildOrder(packageNames, workspacePackages) {
    const visited = new Set();
    const visiting = new Set();
    const result = [];

    function visit(packageName) {
        if (visited.has(packageName)) {
            return;
        }

        if (visiting.has(packageName)) {
            throw new Error(
                `Circular workspace dependency detected: ${packageName}`
            );
        }

        if (!workspacePackages.has(packageName)) {
            throw new Error(`Workspace package "${packageName}" not found`);
        }

        visiting.add(packageName);

        const dependencies = getInternalDependencies(
            packageName,
            workspacePackages
        );

        for (const dependency of dependencies) {
            visit(dependency);
        }

        visiting.delete(packageName);
        visited.add(packageName);

        result.push(packageName);
    }

    for (const packageName of packageNames) {
        visit(packageName);
    }

    return result;
}

module.exports = {
    ROOT_DIR,
    loadRootPackage,
    getWorkspacePatterns,
    getWorkspacePackagePaths,
    loadWorkspacePackages,
    getInternalDependencies,
    resolveBuildOrder,
};

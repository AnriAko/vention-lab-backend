import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    rmSync,
    statSync,
    unlinkSync,
} from 'node:fs';
import path from 'node:path';

export type SharedSyncConfig = {
    destDir: string;
    sharedPackages: string[];
};

const root = process.cwd();

function assertDirectory(dirPath: string, label: string): void {
    if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
        throw new Error(`${label} not found or is not a directory: ${dirPath}`);
    }
}

function listRelativeFiles(dir: string, base = dir): string[] {
    const files: string[] = [];

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...listRelativeFiles(fullPath, base));
            continue;
        }

        if (entry.isFile()) {
            files.push(path.relative(base, fullPath).split(path.sep).join('/'));
        }
    }

    return files;
}

export function copySharedPackage(
    sharedPackage: string,
    destDir: string
): void {
    const src = path.join(root, 'shared', sharedPackage);
    const dest = path.join(root, destDir, sharedPackage);

    assertDirectory(src, `Shared package "${sharedPackage}"`);

    mkdirSync(dest, { recursive: true });

    const srcFiles = new Set(listRelativeFiles(src));

    for (const relativeFile of srcFiles) {
        const from = path.join(src, relativeFile);
        const to = path.join(dest, relativeFile);

        mkdirSync(path.dirname(to), { recursive: true });
        copyFileSync(from, to);
    }

    if (existsSync(dest)) {
        for (const relativeFile of listRelativeFiles(dest)) {
            if (srcFiles.has(relativeFile)) {
                continue;
            }

            unlinkSync(path.join(dest, relativeFile));
        }

        removeEmptyDirectories(dest);
    }

    console.log(
        `synced shared/${sharedPackage} -> ${destDir}/${sharedPackage}`
    );
}

function removeEmptyDirectories(dir: string): void {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
        return;
    }

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            removeEmptyDirectories(path.join(dir, entry.name));
        }
    }

    if (readdirSync(dir).length === 0) {
        rmSync(dir, { recursive: true });
    }
}

export function syncSharedTarget(config: SharedSyncConfig): void {
    const destRoot = path.join(root, config.destDir);

    mkdirSync(destRoot, { recursive: true });

    for (const sharedPackage of config.sharedPackages) {
        copySharedPackage(sharedPackage, config.destDir);
    }
}

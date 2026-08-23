import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    statSync,
    unlinkSync,
} from 'node:fs';
import path from 'node:path';

export type CopySharedInput = {
    sharedPackage: string;
    microservice: string;
};

export type MicroserviceSharedSyncConfig = {
    microservice: string;
    sharedPackages: string[];
};

const root = process.cwd();

function assertDirectory(dirPath: string, label: string): void {
    if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
        throw new Error(`${label} not found or is not a directory: ${dirPath}`);
    }
}

export function copyShared(input: CopySharedInput): void {
    const { sharedPackage, microservice } = input;

    const src = path.join(root, 'shared', sharedPackage);
    const dest = path.join(
        root,
        'microservices',
        microservice,
        'src',
        'shared',
        sharedPackage
    );

    assertDirectory(src, `Shared package "${sharedPackage}"`);
    assertDirectory(
        path.join(root, 'microservices', microservice),
        `Microservice "${microservice}"`
    );

    mkdirSync(dest, { recursive: true });

    const srcFiles = new Set(
        readdirSync(src).filter((file) =>
            statSync(path.join(src, file)).isFile()
        )
    );

    for (const file of srcFiles) {
        copyFileSync(path.join(src, file), path.join(dest, file));
    }

    for (const file of readdirSync(dest)) {
        const destPath = path.join(dest, file);
        if (!statSync(destPath).isFile() || srcFiles.has(file)) {
            continue;
        }
        unlinkSync(destPath);
    }

    console.log(
        `synced shared/${sharedPackage} -> microservices/${microservice}/src/shared/${sharedPackage}`
    );
}

declare module 'clamscan' {
    import type { Readable } from 'node:stream';

    export type ClamScanResult = {
        file: string | null;
        isInfected: boolean | null;
        viruses: string[];
    };

    export type ClamScanInitOptions = {
        removeInfected?: boolean;
        quarantineInfected?: boolean | string;
        scanLog?: string | null;
        debugMode?: boolean;
        fileList?: string | null;
        scanRecursively?: boolean;
        clamscan?: {
            path?: string;
            db?: string | null;
            scanArchives?: boolean;
            active?: boolean;
        };
        clamdscan?: {
            socket?: string | false;
            host?: string | false;
            port?: number | false;
            timeout?: number;
            localFallback?: boolean;
            path?: string;
            configFile?: string | null;
            multiscan?: boolean;
            reloadDb?: boolean;
            active?: boolean;
            bypassTest?: boolean;
            tls?: boolean;
        };
        preference?: 'clamscan' | 'clamdscan';
    };

    export default class NodeClam {
        init(options?: ClamScanInitOptions): Promise<NodeClam>;
        ping(): Promise<boolean>;
        scanStream(stream: Readable): Promise<ClamScanResult>;
        isInfected(file: string): Promise<ClamScanResult>;
    }
}

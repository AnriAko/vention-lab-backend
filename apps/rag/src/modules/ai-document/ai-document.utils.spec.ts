import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

import { decompressIfNeeded, getFileExtension } from './ai-document.utils';
import { PermanentAiDocumentError } from './ai-document.errors';

const gzipAsync = promisify(gzip);

describe('getFileExtension', () => {
    it('should return file extension', () => {
        expect(getFileExtension('documents/file.pdf')).toBe('pdf');
    });

    it('should return extension in lowercase', () => {
        expect(getFileExtension('documents/file.PDF')).toBe('pdf');
    });

    it('should remove .gz and return the original extension', () => {
        expect(getFileExtension('documents/file.pdf.gz')).toBe('pdf');
    });

    it('should return gz as extension for uppercase .GZ', () => {
        expect(getFileExtension('documents/file.PDF.GZ')).toBe('gz');
    });

    it('should return the storage key when there is no extension', () => {
        expect(getFileExtension('documents/file')).toBe('documents/file');
    });

    it('should throw when the storage key ends with a dot', () => {
        expect(() => getFileExtension('documents/file.')).toThrow(
            PermanentAiDocumentError
        );
    });

    it('should throw when the storage key is empty', () => {
        expect(() => getFileExtension('')).toThrow(
            new PermanentAiDocumentError('File extension is missing')
        );
    });
});

describe('decompressIfNeeded', () => {
    it('should return the original buffer when the file is not gzipped', async () => {
        const buffer = Buffer.from('Hello, world!');

        const result = await decompressIfNeeded(buffer, 'documents/file.pdf');

        expect(result).toBe(buffer);
    });

    it('should decompress a gzipped buffer', async () => {
        const original = Buffer.from('Hello, world!');
        const compressed = await gzipAsync(original);

        const result = await decompressIfNeeded(
            compressed,
            'documents/file.pdf.gz'
        );

        expect(result).toEqual(original);
    });

    it('should preserve empty buffer when the file is not gzipped', async () => {
        const buffer = Buffer.alloc(0);

        const result = await decompressIfNeeded(buffer, 'documents/file.txt');

        expect(result).toBe(buffer);
    });

    it('should throw when gzipped storage key contains invalid gzip data', async () => {
        const buffer = Buffer.from('not a gzip file');

        await expect(
            decompressIfNeeded(buffer, 'documents/file.txt.gz')
        ).rejects.toThrow();
    });
});

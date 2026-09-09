import { getFileExtension } from './file-process.utils';

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

    it('should return gz for uppercase .GZ', () => {
        expect(getFileExtension('documents/file.PDF.GZ')).toBe('gz');
    });

    it('should return the storage key when there is no extension', () => {
        expect(getFileExtension('documents/file')).toBe('documents/file');
    });

    it('should return null for empty storage key', () => {
        expect(getFileExtension('')).toBeNull();
    });

    it('should return null when storage key ends with a dot', () => {
        expect(getFileExtension('documents/file.')).toBeNull();
    });
});

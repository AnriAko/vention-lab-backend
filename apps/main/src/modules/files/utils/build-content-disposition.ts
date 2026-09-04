export const buildContentDisposition = (filename: string): string => {
    const sanitized = filename.replace(/["\\\r\n]/g, '_');
    const encoded = encodeURIComponent(filename);

    return `attachment; filename="${sanitized}"; filename*=UTF-8''${encoded}`;
};

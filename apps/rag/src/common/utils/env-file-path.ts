export const envFilePath = (() => {
    const env = process.env.NODE_ENV;

    switch (env) {
        case 'production':
            return ['.env.production.local', '../../.env.production.local'];
        case 'development':
        default:
            return ['.env.development.local', '../../.env.development.local'];
    }
})();

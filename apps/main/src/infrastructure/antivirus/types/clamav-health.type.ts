export type ClamAvHealthStatus = 'up' | 'down';

export type ClamAvHealth = {
    status: ClamAvHealthStatus;
    enabled: boolean;
    message: string;
};

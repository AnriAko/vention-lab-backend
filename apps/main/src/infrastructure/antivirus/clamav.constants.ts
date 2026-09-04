export const CLAMAV_HEALTH_MESSAGE = {
    DISABLED:
        'Antivirus is not running (CLAMAV_ENABLED=false). File uploads skip virus scanning.',
    DISCONNECTED:
        'Antivirus is enabled but ClamAV is not connected or failed to initialize.',
    UP: 'Antivirus is running and responding to health checks.',
    UNREACHABLE:
        'Antivirus is enabled but ClamAV did not respond to the health check.',
} as const;

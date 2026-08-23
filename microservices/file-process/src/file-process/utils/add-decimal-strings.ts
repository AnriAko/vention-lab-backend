export function addDecimalStrings(a: string, b: string): string {
    const [aIntRaw, aFracRaw = ''] = a.split('.');
    const [bIntRaw, bFracRaw = ''] = b.split('.');
    const scale = Math.max(aFracRaw.length, bFracRaw.length);
    const aInt =
        BigInt(
            `${aIntRaw}${aFracRaw.padEnd(scale, '0')}`.replace(/^-/, '') || '0'
        ) * (a.startsWith('-') ? -1n : 1n);
    const bInt =
        BigInt(
            `${bIntRaw}${bFracRaw.padEnd(scale, '0')}`.replace(/^-/, '') || '0'
        ) * (b.startsWith('-') ? -1n : 1n);
    const sum = aInt + bInt;
    const negative = sum < 0n;
    const digits = (negative ? -sum : sum).toString().padStart(scale + 1, '0');
    const whole = scale === 0 ? digits : digits.slice(0, -scale) || '0';
    const fraction = scale === 0 ? '' : digits.slice(-scale);
    const value = scale === 0 ? whole : `${whole}.${fraction}`;

    return negative ? `-${value}` : value;
}

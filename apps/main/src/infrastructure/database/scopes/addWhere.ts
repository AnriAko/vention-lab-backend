export type Scope = Record<string, unknown>;

export const addWhere = <T extends Scope, U extends Scope>(
    base: T,
    extra: U
): T & U => ({
    ...base,
    ...extra,
});

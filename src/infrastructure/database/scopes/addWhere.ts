export const addWhere = <T extends object>(
    base: T,
    ...conditions: object[]
) => {
    return Object.assign({}, base, ...conditions);
};

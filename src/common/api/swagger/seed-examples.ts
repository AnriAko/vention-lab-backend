export const SEED_PASSWORD = 'Password123!';

export const SEED_ORGANIZATIONS = {
    catFans: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'CatFans',
        adminEmail: 'admin.catfans@example.com',
        adminId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        adminName: 'CatFans Admin',
    },
    dogFans: {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'DogFans',
        adminEmail: 'admin.dogfans@example.com',
        adminId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        adminName: 'DogFans Admin',
    },
    birdFans: {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'BirdFans',
        adminEmail: 'admin.birdfans@example.com',
        adminId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        adminName: 'BirdFans Admin',
    },
} as const;

export const SEED_USERS = {
    owner: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'owner@example.com',
        name: 'Super Owner',
        password: SEED_PASSWORD,
    },
    demoMember: {
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        email: 'user1@example.com',
        name: 'Demo CatFans Member',
        password: SEED_PASSWORD,
    },
} as const;

export const SEED_LOGIN_OWNER = {
    email: SEED_USERS.owner.email,
    password: SEED_PASSWORD,
} as const;

export const SEED_LOGIN_ORG_ADMIN = {
    email: SEED_ORGANIZATIONS.catFans.adminEmail,
    password: SEED_PASSWORD,
} as const;

export const SEED_LOGIN_MEMBER = {
    email: SEED_USERS.demoMember.email,
    password: SEED_PASSWORD,
} as const;

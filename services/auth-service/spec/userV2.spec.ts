import {
    createUserV2,
    getUserByIdV2,
    deleteUser,
} from '../src/persistence/user';

beforeEach(() => {
    jest.resetModules();
});

test('créer un utilisateur v2 avec birthDate', () => {
    const user = createUserV2('v2@test.com', 'password123', true, '1990-01-15');
    expect(user).not.toBeNull();
    expect(user!.email).toBe('v2@test.com');
    expect(user!.birthDate).toBe('1990-01-15');
    expect(user!.consent).toBe(true);
    expect(user!.password).not.toBe('password123');
});

test('refuser un email déjà utilisé en v2', () => {
    createUserV2('v2dup@test.com', 'pass1', true, '1990-01-01');
    const duplicate = createUserV2(
        'v2dup@test.com',
        'pass2',
        true,
        '1990-02-02',
    );
    expect(duplicate).toBeNull();
});

test('getUserByIdV2 retourne birthDate', () => {
    const user = createUserV2('v2get@test.com', 'pass', true, '1995-06-20');
    const found = getUserByIdV2(user!.id);
    expect(found).not.toBeNull();
    expect(found!.email).toBe('v2get@test.com');
    expect(found!.birthDate).toBe('1995-06-20');
});

test('getUserByIdV2 retourne null si inexistant', () => {
    const found = getUserByIdV2(99999);
    expect(found).toBeNull();
});

test('getUserByIdV2 ne retourne pas le mot de passe', () => {
    const user = createUserV2('v2safe@test.com', 'secret', true, '2000-01-01');
    const found = getUserByIdV2(user!.id) as Record<string, unknown>;
    expect(found).not.toHaveProperty('password');
});

test('supprimer un utilisateur créé en v2', () => {
    const user = createUserV2('v2del@test.com', 'pass', true, '1988-03-10');
    const result = deleteUser(user!.id);
    expect(result).toBe(true);
});

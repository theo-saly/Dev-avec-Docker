import {
    createUser,
    authenticateUser,
    deleteUser,
} from '../src/persistence/user';
import jwt from 'jsonwebtoken';

beforeEach(() => {
    jest.resetModules();
});

test('créer un utilisateur avec succès', () => {
    const user = createUser('test@test.com', 'password123', true);
    expect(user).not.toBeNull();
    expect(user!.email).toBe('test@test.com');
    expect(user!.consent).toBe(true);
    expect(user!.password).not.toBe('password123');
});

test('refuser un email déjà utilisé', () => {
    createUser('duplicate@test.com', 'pass1', true);
    const duplicate = createUser('duplicate@test.com', 'pass2', true);
    expect(duplicate).toBeNull();
});

test('login avec identifiants valides retourne un JWT', () => {
    createUser('login@test.com', 'mypassword', true);
    const token = authenticateUser('login@test.com', 'mypassword');
    expect(token).not.toBeNull();

    const decoded = jwt.verify(
        token!,
        process.env.JWT_SECRET || 'SECRET_KEY',
    ) as { email: string };
    expect(decoded.email).toBe('login@test.com');
});

test('supprimer un utilisateur existant', () => {
    const user = createUser('delete@test.com', 'pass', true);
    const result = deleteUser(user!.id);
    expect(result).toBe(true);
});
test('ID unique après suppression et recréation', () => {
    const user1 = createUser('first@test.com', 'pass', true);
    const id1 = user1!.id;
    deleteUser(id1);

    const user2 = createUser('second@test.com', 'pass', true);
    expect(user2!.id).not.toBe(id1);
});

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User {
    id: number;
    email: string;
    password: string;
    consent: boolean;
    birthDate?: string;
}

const users: User[] = [];
let nextId = 1;

export function createUser(
    email: string,
    password: string,
    consent: boolean,
): User | null {
    if (users.some((u) => u.email === email)) return null;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user: User = {
        id: nextId++,
        email,
        password: hashedPassword,
        consent,
    };
    users.push(user);
    return user;
}

export function authenticateUser(
    email: string,
    password: string,
): string | null {
    const user = users.find((u) => u.email === email);
    if (!user) return null;
    if (!bcrypt.compareSync(password, user.password)) return null;
    if (!user.consent) return null;
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'SECRET_KEY',
        {
            expiresIn: '1h',
        },
    );
}

export function deleteUser(id: number): boolean {
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
}

export function createUserV2(
    email: string,
    password: string,
    consent: boolean,
    birthDate: string,
): User | null {
    if (users.some((u) => u.email === email)) return null;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user: User = {
        id: nextId++,
        email,
        password: hashedPassword,
        consent,
        birthDate,
    };
    users.push(user);
    return user;
}

export function getUserById(id: number): Pick<User, 'id' | 'email'> | null {
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    return {
        id: user.id,
        email: user.email,
    };
}

export function getUserByIdV2(
    id: number,
): Pick<User, 'id' | 'email' | 'birthDate'> | null {
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    return {
        id: user.id,
        email: user.email,
        birthDate: user.birthDate,
    };
}

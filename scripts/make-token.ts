import jwt from 'jsonwebtoken';

// Génère des tokens de test conformes au contrat auth-service (HS256, 1 h).
const secret = process.env.JWT_SECRET || 'SECRET_KEY';

const sign = (id: number, email: string, role: 'standard' | 'admin') =>
    jwt.sign({ id, email, role }, secret, {
        algorithm: 'HS256',
        expiresIn: '1h',
    });

console.log('STANDARD=' + sign(1, 'user@example.com', 'standard'));
console.log('ADMIN=' + sign(2, 'admin@example.com', 'admin'));

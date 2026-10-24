import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateUser, deleteUser } from '../persistence/user';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: number;
    email: string;
}

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

export function applyCommonAuthRoutes(router: Router): void {
    router.post('/login', authRateLimit, (req, res) => {
        const { email, password } = req.body;
        const token = authenticateUser(email, password);
        if (!token) {
            return res.status(401).json({
                error: 'Identifiants invalides ou consentement manquant',
            });
        }
        res.json({ token });
    });

    router.delete('/profile', authRateLimit, (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ error: 'Token manquant' });
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'SECRET_KEY',
            ) as TokenPayload;
            const success = deleteUser(decoded.id);
            if (!success)
                return res
                    .status(404)
                    .json({ error: 'Utilisateur non trouvé' });
            res.json({ message: 'Votre compte a bien été supprimé.' });
        } catch {
            res.status(401).json({ error: 'Token invalide' });
        }
    });
}

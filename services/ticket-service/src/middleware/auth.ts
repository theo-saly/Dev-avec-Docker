import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: number;
    email: string;
    role: 'standard' | 'admin';
}

export function requireAuth(req, res, next) {
    const header = req.headers?.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    try {
        const payload = jwt.verify(
            header.slice('Bearer '.length),
            process.env.JWT_SECRET || '',
            { algorithms: ['HS256'] },
        ) as AuthUser;
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
}

export function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Droits administrateur requis' });
    }
    next();
}

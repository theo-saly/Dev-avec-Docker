import type { TokenUser } from '../types';

export function normalizePath(pathname: string): string {
    if (!pathname) return '/';
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }
    return pathname;
}

// Compare un chemin à un motif (ex : /events/:id) et renvoie les paramètres,
// ou null si le chemin ne correspond pas.
export function matchPath(
    pattern: string,
    pathname: string,
): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = normalizePath(pathname).split('/');
    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
        } else if (patternParts[i] !== pathParts[i]) {
            return null;
        }
    }
    return params;
}

// Lit { id, email, role } dans le token. Un token illisible ou expiré
// (claim `exp`) est considéré comme absent.
export function decodeToken(token: string): TokenUser | null {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64)) as {
            id?: number;
            email?: string;
            role?: string;
            exp?: number;
        };
        if (decoded.exp && decoded.exp * 1000 <= Date.now()) return null;
        if (decoded.id === undefined || !decoded.email) return null;
        const role = decoded.role === 'admin' ? 'admin' : 'standard';
        return { id: decoded.id, email: decoded.email, role };
    } catch {
        return null;
    }
}

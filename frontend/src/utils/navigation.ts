export type AppHeaders = Record<string, string>;

export function normalizePath(pathname: string): string {
    if (!pathname) return '/';
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }
    return pathname;
}

export function matchProjectPath(pathname: string): string {
    const match = normalizePath(pathname).match(/^\/projects\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function buildHeaders(token: string, includeJson: boolean): AppHeaders {
    const headers: Record<string, string> = {};
    if (includeJson) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

export function getUserIdFromToken(token: string): string | null {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decoded = JSON.parse(atob(parts[1])) as {
            id?: string;
            userId?: string;
            sub?: string;
        };
        return decoded.id || decoded.userId || decoded.sub || null;
    } catch (err) {
        console.error('Erreur lors de la décodification du token:', err);
        return null;
    }
}

export async function parseApiResponse<T = unknown>(
    response: Response,
): Promise<T> {
    const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
    } & T;
    if (!response.ok) {
        throw new Error((payload as { error?: string }).error || 'Erreur API');
    }
    return payload as T;
}

function normalizePath(pathname) {
    if (!pathname) return '/';
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }
    return pathname;
}

function matchProjectPath(pathname) {
    const match = normalizePath(pathname).match(/^\/projects\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : '';
}

function buildHeaders(token, includeJson) {
    const headers = {};
    if (includeJson) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

function apiUrl(path) {
    return `/api/v1${path}`;
}

function getUserIdFromToken(token) {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decoded = JSON.parse(atob(parts[1]));

        // ID utilisateur
        const userId = decoded.id || decoded.userId || decoded.sub;
        //console.log('Token decoded:', decoded);
        //console.log('User ID extrait:', userId);
        return userId || null;
    } catch (err) {
        console.error('Erreur lors de la décodification du token:', err);
        return null;
    }
}

async function parseApiResponse(response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || 'Erreur API');
    }
    return payload;
}

// Un seul préfixe d'API : /api/ (le reverse-proxy route vers les services).
let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(handler: () => void) {
    onUnauthorized = handler;
}

interface ApiOptions {
    method?: string;
    body?: unknown;
    token?: string;
    // Pour le login : un 401 y signifie « mauvais identifiants ».
    keepSessionOn401?: boolean;
}

export async function api<T = unknown>(
    path: string,
    { method = 'GET', body, token, keepSessionOn401 }: ApiOptions = {},
): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401 && !keepSessionOn401) onUnauthorized();

    const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
    };
    if (!response.ok) throw new Error(payload.error || 'Erreur API');
    return payload as T;
}

export function formatPrice(priceCents: number): string {
    return priceCents === 0
        ? 'Gratuit'
        : `${(priceCents / 100).toFixed(2).replace('.', ',')} €`;
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
    });
}

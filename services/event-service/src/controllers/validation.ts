const isText = (value) => typeof value === 'string' && value.trim() !== '';

// Valide les champs d'un événement. En mode `partial` (PUT), seuls les champs
// présents dans le body sont contrôlés. Renvoie un message d'erreur ou null.
export function validateEvent(body, partial = false): string | null {
    const has = (field) => body?.[field] !== undefined;

    for (const field of ['title', 'description', 'venue']) {
        if (partial && !has(field)) continue;
        if (!isText(body?.[field])) return `Champ requis : ${field}`;
    }

    if (!partial || has('startsAt')) {
        if (!body?.startsAt || Number.isNaN(Date.parse(body.startsAt))) {
            return 'startsAt doit être une date valide';
        }
    }

    if (!partial || has('capacity')) {
        if (!Number.isInteger(body?.capacity) || body.capacity <= 0) {
            return 'capacity doit être un entier supérieur à 0';
        }
    }

    if (has('priceCents')) {
        if (!Number.isInteger(body.priceCents) || body.priceCents < 0) {
            return 'priceCents doit être un entier positif ou nul';
        }
    }

    return null;
}

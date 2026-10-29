// Habillage des événements : une teinte stable par événement, pour que les
// billets d'une même liste ne se ressemblent pas.
const TONES = ['blue', 'coral', 'sun', 'mint', 'night'] as const;
export type Tone = (typeof TONES)[number];

export function tone(id: string): Tone {
    const sum = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return TONES[sum % TONES.length];
}

export function dateParts(iso: string) {
    const d = new Date(iso);
    return {
        day: d.toLocaleDateString('fr-FR', { day: '2-digit' }),
        month: d
            .toLocaleDateString('fr-FR', { month: 'short' })
            .replace('.', ''),
        time: d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
}

export function remainingLabel(remaining: number | undefined): string {
    if (remaining === undefined) return 'Places : voir détail';
    if (remaining === 0) return 'Complet';
    return remaining === 1 ? '1 place' : `${remaining} places`;
}

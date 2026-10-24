import { migrations } from '../../src/migrations/migrations';

test('une seule migration : 001_create_events_table', () => {
    expect(migrations.map((m) => `${m.id}_${m.name}`)).toEqual([
        '001_create_events_table',
    ]);
});

test('la migration crée la table events avec le prix en centimes', () => {
    const sql = migrations[0].up.join(' ');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS events');
    expect(sql).toContain('price_cents');
    expect(sql).toContain('capacity');
    expect(migrations[0].down).toEqual(['DROP TABLE IF EXISTS events']);
});

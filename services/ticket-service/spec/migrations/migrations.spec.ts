import { migrations } from '../../src/migrations/migrations';

test('une seule migration : 001_create_tickets_table', () => {
    expect(migrations.map((m) => `${m.id}_${m.name}`)).toEqual([
        '001_create_tickets_table',
    ]);
});

test('la table tickets n a pas de clé étrangère vers events', () => {
    const sql = migrations[0].up.join(' ');
    expect(sql).toContain("ENUM('booked','cancelled')");
    expect(sql).not.toContain('FOREIGN KEY');
});

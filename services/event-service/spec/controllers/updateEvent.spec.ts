import db from '../../src/persistence';
import updateEvent from '../../src/controllers/updateEvent';

jest.mock('../../src/persistence', () => ({
    getEvent: jest.fn(),
    updateEvent: jest.fn(),
}));

const existing = {
    id: 'e1',
    title: 'Ancien titre',
    description: 'Description',
    venue: 'Salle A',
    startsAt: new Date('2026-12-01T20:00:00Z'),
    capacity: 50,
    priceCents: 1000,
};

test('met à jour seulement les champs envoyés', async () => {
    (db.getEvent as jest.Mock).mockResolvedValue(existing);
    const res = {
        send: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
    };

    await updateEvent(
        { params: { id: 'e1' }, body: { title: 'Nouveau' } },
        res,
    );

    expect(db.updateEvent as jest.Mock).toHaveBeenCalledTimes(1);
    const saved = (db.updateEvent as jest.Mock).mock.calls[0][1];
    expect(saved.title).toBe('Nouveau');
    expect(saved.venue).toBe('Salle A');
    expect(saved.capacity).toBe(50);
    expect(saved.priceCents).toBe(1000);
});

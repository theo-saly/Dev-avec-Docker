import db from '../../src/persistence';
import createEvent from '../../src/controllers/createEvent';
import { v4 as uuid } from 'uuid';

jest.mock('uuid', () => ({ v4: jest.fn() }));

jest.mock('../../src/persistence', () => ({
    storeEvent: jest.fn(),
}));

const validBody = {
    title: 'Concert',
    description: 'Un concert de test',
    venue: 'Zénith',
    startsAt: '2026-12-01T20:00:00Z',
    capacity: 100,
    priceCents: 4500,
};

const makeRes = () => ({
    send: jest.fn(),
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
});

beforeEach(() => jest.clearAllMocks());

test('création valide → 201 et storeEvent appelé une fois', async () => {
    (uuid as jest.Mock).mockReturnValue('event-id-123');
    const res = makeRes();

    await createEvent({ body: validBody }, res);

    expect(db.storeEvent as jest.Mock).toHaveBeenCalledTimes(1);
    const stored = (db.storeEvent as jest.Mock).mock.calls[0][0];
    expect(stored.id).toBe('event-id-123');
    expect(stored.priceCents).toBe(4500);
    expect(res.status).toHaveBeenCalledWith(201);
});

test('capacity à 0 → 400, rien n est stocké', async () => {
    const res = makeRes();
    await createEvent({ body: { ...validBody, capacity: 0 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.storeEvent as jest.Mock).not.toHaveBeenCalled();
});

test('titre manquant → 400, rien n est stocké', async () => {
    const res = makeRes();
    await createEvent({ body: { ...validBody, title: undefined } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.storeEvent as jest.Mock).not.toHaveBeenCalled();
});

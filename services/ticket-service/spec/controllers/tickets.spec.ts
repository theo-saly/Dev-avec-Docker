import db from '../../src/persistence';
import bookTicket from '../../src/controllers/bookTicket';
import listMyTickets from '../../src/controllers/listMyTickets';
import cancelTicket from '../../src/controllers/cancelTicket';
import { getEvent } from '../../src/clients/eventClient';
import { publishEvent } from '../../src/events/publisher';

jest.mock('uuid', () => {
    let n = 0;
    return { v4: () => `ticket-${++n}` };
});
jest.mock('../../src/clients/eventClient', () => ({ getEvent: jest.fn() }));
jest.mock('../../src/events/publisher', () => ({ publishEvent: jest.fn() }));

const EVENT = { id: 'e1', title: 'Concert', capacity: 10 };

const makeRes = () => ({
    send: jest.fn(),
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
});

const book = (res, body, userId = 5) =>
    bookTicket(
        { body, user: { id: userId }, headers: { authorization: 'Bearer x' } },
        res,
    );

const seed = (id, userId, quantity, eventId = 'e1') =>
    db.storeTicket({
        id,
        eventId,
        userId,
        quantity,
        status: 'booked',
        createdAt: new Date(),
    });

beforeEach(async () => {
    jest.clearAllMocks();
    await db.init();
    (getEvent as jest.Mock).mockResolvedValue(EVENT);
});

test('réservation valide → 201, billet stocké avec le user_id du token', async () => {
    const res = makeRes();

    await book(res, { eventId: 'e1', quantity: 2, userId: 999 });

    expect(res.status).toHaveBeenCalledWith(201);
    const tickets = await db.getByUser(5);
    expect(tickets).toHaveLength(1);
    expect(tickets[0].quantity).toBe(2);
    expect(await db.getByUser(999)).toHaveLength(0);
    expect(publishEvent).toHaveBeenCalledWith(
        'ticket-booked',
        expect.objectContaining({ userId: '5', quantity: '2' }),
    );
});

test('événement complet (10 places, 8 réservées, demande de 3) → 409', async () => {
    await seed('t0', 1, 8);
    const res = makeRes();

    await book(res, { eventId: 'e1', quantity: 3 });

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Plus assez de places' });
    expect(await db.getByUser(5)).toHaveLength(0);
    expect(await db.countBooked('e1')).toBe(8);
});

test('exactement la dernière place (8 réservées, demande de 2) → 201', async () => {
    await seed('t0', 1, 8);
    const res = makeRes();

    await book(res, { eventId: 'e1', quantity: 2 });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(await db.countBooked('e1')).toBe(10);
});

test('événement inexistant (client mocké → null) → 404', async () => {
    (getEvent as jest.Mock).mockResolvedValue(null);
    const res = makeRes();

    await book(res, { eventId: 'inconnu', quantity: 1 });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(await db.getByUser(5)).toHaveLength(0);
});

test.each([0, 11])('quantity à %i → 400', async (quantity) => {
    const res = makeRes();

    await book(res, { eventId: 'e1', quantity });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getEvent).not.toHaveBeenCalled();
});

test('GET /tickets/me ne renvoie que les billets de l utilisateur', async () => {
    await seed('mine', 5, 1);
    await seed('other', 6, 1);
    const res = makeRes();

    await listMyTickets({ user: { id: 5 } }, res);

    const sent = res.send.mock.calls[0][0];
    expect(sent.map((t) => t.id)).toEqual(['mine']);
});

test('annulation du billet de quelqu un d autre → 403', async () => {
    await seed('other', 6, 1);
    const res = makeRes();

    await cancelTicket({ params: { id: 'other' }, user: { id: 5 } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect((await db.getTicket('other')).status).toBe('booked');
});

test('un billet annulé ne compte plus dans la capacité', async () => {
    await seed('t0', 5, 8);
    await cancelTicket({ params: { id: 't0' }, user: { id: 5 } }, makeRes());
    expect(await db.countBooked('e1')).toBe(0);

    const res = makeRes();
    await book(res, { eventId: 'e1', quantity: 10 }, 7);

    expect(res.status).toHaveBeenCalledWith(201);
});

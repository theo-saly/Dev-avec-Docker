import fs from 'fs';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    appendFileSync: jest.fn(),
}));

import { writeLog } from '../src/logger';

const lastLine = () =>
    (fs.appendFileSync as jest.Mock).mock.calls[0][1] as string;

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('ticket-booked produit le message de réservation', () => {
    writeLog({
        eventType: 'ticket-booked',
        ticketId: 't1',
        eventId: 'e1',
        eventTitle: 'Concert',
        userId: '5',
        quantity: '2',
        timestamp: '2026-10-29T12:00:00.000Z',
    });

    expect(lastLine()).toContain(
        "Billet réservé : 2 places pour l'événement Concert par l'utilisateur 5",
    );
});

test('ticket-cancelled notifie l annulation', () => {
    writeLog({
        eventType: 'ticket-cancelled',
        ticketId: 't1',
        eventId: 'e1',
        userId: '5',
        quantity: '2',
    });

    expect(lastLine()).toContain('Billet annulé');
});

test('event-deleted notifie la suppression', () => {
    writeLog({
        eventType: 'event-deleted',
        eventId: 'e1',
        eventTitle: 'Concert',
    });

    expect(lastLine()).toContain('Événement supprimé');
    expect(lastLine()).toContain('Concert');
});

test('événement inconnu est loggé en JSON', () => {
    writeLog({ eventType: 'UnknownEvent', data: 'test' });

    expect(lastLine()).toContain('UnknownEvent');
});

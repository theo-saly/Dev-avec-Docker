import db from '../../src/persistence';
import deleteEvent from '../../src/controllers/deleteEvent';
import { publishEvent } from '../../src/events/publisher';

jest.mock('../../src/persistence', () => ({
    getEvent: jest.fn(),
    removeEvent: jest.fn(),
}));

jest.mock('../../src/events/publisher', () => ({
    publishEvent: jest.fn(),
}));

test('suppression → 204 et événement Redis publié', async () => {
    (db.getEvent as jest.Mock).mockResolvedValue({
        id: 'e1',
        title: 'Concert',
    });
    const res = {
        sendStatus: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
    };

    await deleteEvent({ params: { id: 'e1' } }, res);

    expect(db.removeEvent as jest.Mock).toHaveBeenCalledWith('e1');
    expect(publishEvent).toHaveBeenCalledWith('event-deleted', {
        eventId: 'e1',
        eventTitle: 'Concert',
    });
    expect(res.sendStatus).toHaveBeenCalledWith(204);
});

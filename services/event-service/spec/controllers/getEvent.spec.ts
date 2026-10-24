import db from '../../src/persistence';
import getEvent from '../../src/controllers/getEvent';

jest.mock('../../src/persistence', () => ({
    getEvent: jest.fn(),
}));

test('id inconnu → 404', async () => {
    (db.getEvent as jest.Mock).mockResolvedValue(undefined);
    const res = {
        send: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
    };

    await getEvent({ params: { id: 'inconnu' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).not.toHaveBeenCalled();
});

import db from '../../src/persistence';
import getTasks from '../../src/controllers/getTask';

jest.mock('../../src/persistence', () => ({
    getTasks: jest.fn(),
}));

test('lister toutes les tâches', async () => {
    const tasks = [
        { id: '1', title: 'Tâche 1', status: 'à faire' },
        { id: '2', title: 'Tâche 2', status: 'terminé' },
    ];
    (db.getTasks as jest.Mock).mockResolvedValue(tasks);

    const req = {};
    const res = { send: jest.fn() };

    await getTasks(req, res);

    expect(res.send).toHaveBeenCalledWith(tasks);
});

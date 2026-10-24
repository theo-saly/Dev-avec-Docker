import db from '../../src/persistence';
import deleteTask from '../../src/controllers/deleteTask';

jest.mock('../../src/persistence', () => ({
    removeTask: jest.fn(),
}));

test('supprimer une tâche', async () => {
    const req = { params: { id: 'task-123' } };
    const res = { sendStatus: jest.fn() };

    await deleteTask(req, res);

    expect(db.removeTask as jest.Mock).toHaveBeenCalledWith('task-123');
    expect(res.sendStatus).toHaveBeenCalledWith(200);
});

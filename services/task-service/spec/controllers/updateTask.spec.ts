import db from '../../src/persistence';
import updateTask from '../../src/controllers/updateTask';

jest.mock('../../src/persistence', () => ({
    getTask: jest.fn(),
    updateTask: jest.fn(),
}));

jest.mock('../../src/events/publisher', () => ({
    publishEvent: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

test('use case 3 : marquer une tâche comme terminée', async () => {
    const existingTask = {
        id: 'task-1',
        title: 'Ma tâche',
        description: '',
        status: 'à faire',
        echeance: null,
        projectId: 'proj-1',
    };

    const req = { params: { id: 'task-1' }, body: { status: 'terminé' } };
    const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    (db.getTask as jest.Mock).mockResolvedValueOnce(existingTask);
    (db.getTask as jest.Mock).mockResolvedValueOnce({
        ...existingTask,
        status: 'terminé',
    });

    await updateTask(req, res);

    expect(db.updateTask as jest.Mock).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'terminé' }),
    );
});

test('use case 3 : refuser un status invalide', async () => {
    const existingTask = {
        id: 'task-1',
        title: 'Ma tâche',
        description: '',
        status: 'à faire',
        echeance: null,
        projectId: 'proj-1',
    };
    (db.getTask as jest.Mock).mockResolvedValueOnce(existingTask);

    const req = { params: { id: 'task-1' }, body: { status: 'invalide' } };
    const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('invalide') }),
    );
    expect(db.updateTask as jest.Mock).not.toHaveBeenCalled();
});

import db from '../../src/persistence';
import getTasksByProject from '../../src/controllers/getTasksByProject';

jest.mock('../../src/persistence', () => ({
    getTasksByProject: jest.fn(),
}));

test("récupérer les tâches d'un projet", async () => {
    const tasks = [{ id: '1', title: 'Tâche 1', projectId: 'proj-1' }];
    (db.getTasksByProject as jest.Mock).mockResolvedValue(tasks);

    const req = { query: { projectId: 'proj-1' } };
    const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await getTasksByProject(req, res);

    expect(db.getTasksByProject as jest.Mock).toHaveBeenCalledWith('proj-1');
    expect(res.send).toHaveBeenCalledWith(tasks);
});

test('refuser si projectId manquant', async () => {
    const req = { query: {} };
    const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await getTasksByProject(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
            error: expect.stringContaining('projectId'),
        }),
    );
});

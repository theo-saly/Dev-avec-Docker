import db from '../../src/persistence';
import addTask from '../../src/controllers/addTask';
import { v4 as uuid } from 'uuid';

jest.mock('uuid', () => ({ v4: jest.fn() }));

jest.mock('../../src/persistence', () => ({
    storeTask: jest.fn(),
}));

test('use case 2 : créer une tâche associée à un projet', async () => {
    const id = 'task-id-123';
    (uuid as jest.Mock).mockReturnValue(id);

    const req = {
        body: {
            title: 'Ma tâche',
            description: 'Description',
            status: 'à faire',
            echeance: '2026-03-15',
            projectId: 'project-id-456',
        },
    };
    const res = { send: jest.fn() };

    await addTask(req, res);

    expect(db.storeTask as jest.Mock).toHaveBeenCalledTimes(1);
    const stored = (db.storeTask as jest.Mock).mock.calls[0][0];
    expect(stored.id).toBe(id);
    expect(stored.title).toBe('Ma tâche');
    expect(stored.projectId).toBe('project-id-456');
    expect(stored.status).toBe('à faire');
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ id, projectId: 'project-id-456' }),
    );
});

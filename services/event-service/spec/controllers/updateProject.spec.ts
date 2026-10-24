import db from '../../src/persistence';
import updateProject from '../../src/controllers/updateProject';

jest.mock('../../src/persistence', () => ({
    getProject: jest.fn(),
    updateProject: jest.fn(),
}));

jest.mock('../../src/events/publisher', () => ({
    publishEvent: jest.fn(),
}));

const PROJECT = {
    id: 'proj-1',
    name: 'Mon projet',
    description: '',
    status: 'en cours',
    echeance: null,
    ownerId: 'user-1',
};

function mockRes() {
    return {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
}

function mockFetchWith(data: unknown) {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => data,
    }) as unknown as jest.Mock;
}

beforeEach(() => {
    jest.clearAllMocks();
});

test('use case 4 : clôturer un projet quand toutes les tâches sont terminées', async () => {
    (db.getProject as jest.Mock)
        .mockResolvedValueOnce(PROJECT)
        .mockResolvedValueOnce({ ...PROJECT, status: 'cloturé' });

    mockFetchWith([
        { id: 't1', status: 'terminé' },
        { id: 't2', status: 'terminé' },
    ]);

    const req = { params: { id: 'proj-1' }, body: { status: 'cloturé' } };
    const res = mockRes();

    await updateProject(req, res);

    expect(db.updateProject as jest.Mock).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cloturé' }),
    );
});

test('use case 4 : refuser la clôture si des tâches ne sont pas terminées', async () => {
    (db.getProject as jest.Mock).mockResolvedValueOnce(PROJECT);

    mockFetchWith([
        { id: 't1', status: 'terminé' },
        { id: 't2', status: 'en cours' },
    ]);

    const req = { params: { id: 'proj-1' }, body: { status: 'cloturé' } };
    const res = mockRes();

    await updateProject(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('tâches') }),
    );
    expect(db.updateProject as jest.Mock).not.toHaveBeenCalled();
});

test("use case 4 : refuser la clôture si le projet n'a aucune tâche", async () => {
    (db.getProject as jest.Mock).mockResolvedValueOnce(PROJECT);

    mockFetchWith([]);

    const req = { params: { id: 'proj-1' }, body: { status: 'cloturé' } };
    const res = mockRes();

    await updateProject(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.updateProject as jest.Mock).not.toHaveBeenCalled();
});

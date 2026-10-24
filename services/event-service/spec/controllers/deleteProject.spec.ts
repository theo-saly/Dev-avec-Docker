import db from '../../src/persistence';
import deleteProject from '../../src/controllers/deleteProject';

jest.mock('../../src/persistence', () => ({
    getProject: jest.fn(),
    removeProject: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

test('supprimer un projet existant', async () => {
    (db.getProject as jest.Mock).mockResolvedValue({
        id: 'proj-1',
        name: 'Mon projet',
    });

    const req = { params: { id: 'proj-1' } };
    const res = {
        sendStatus: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await deleteProject(req, res);

    expect(db.removeProject as jest.Mock).toHaveBeenCalledWith('proj-1');
    expect(res.sendStatus).toHaveBeenCalledWith(200);
});

test("refuser la suppression d'un projet inexistant", async () => {
    (db.getProject as jest.Mock).mockResolvedValue(undefined);

    const req = { params: { id: 'inexistant' } };
    const res = {
        sendStatus: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    await deleteProject(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(db.removeProject as jest.Mock).not.toHaveBeenCalled();
});

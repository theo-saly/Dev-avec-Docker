import jwt from 'jsonwebtoken';
import { requireAuth, requireAdmin } from '../../src/middleware/auth';

const SECRET = 'test-secret';

const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const sign = (role: string, secret = SECRET) =>
    jwt.sign({ id: 1, email: 'a@b.c', role }, secret, { expiresIn: '1h' });

beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
});

test('requireAuth : token absent → 401', () => {
    const res = makeRes();
    const next = jest.fn();
    requireAuth({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('requireAuth : token signé avec un autre secret → 401', () => {
    const res = makeRes();
    const next = jest.fn();
    const req = {
        headers: { authorization: `Bearer ${sign('admin', 'autre-secret')}` },
    };
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('requireAuth : token valide → req.user rempli', () => {
    const res = makeRes();
    const next = jest.fn();
    const req: any = { headers: { authorization: `Bearer ${sign('standard')}` } };
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 1, email: 'a@b.c', role: 'standard' });
});

test('requireAdmin : rôle standard → 403', () => {
    const res = makeRes();
    const next = jest.fn();
    requireAdmin({ user: { id: 1, role: 'standard' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
});

test('requireAdmin : rôle admin → passe', () => {
    const next = jest.fn();
    requireAdmin({ user: { id: 1, role: 'admin' } }, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
});

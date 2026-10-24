import express from 'express';
import request from 'supertest';
import authV2Router from '../../src/routes/authV2';

const app = express();
app.use(express.json());
app.use('/v2/auth', authV2Router);

beforeAll(() => {
    process.env.NODE_ENV = 'test';
});

describe('POST /v2/auth/register', () => {
    test('inscription réussie avec birthDate', async () => {
        const res = await request(app).post('/v2/auth/register').send({
            email: 'newv2@test.com',
            password: 'password123',
            consent: true,
            birthDate: '1990-01-15',
        });
        expect(res.status).toBe(201);
        expect(res.body.email).toBe('newv2@test.com');
        expect(res.body.birthDate).toBe('1990-01-15');
        expect(res.body).not.toHaveProperty('password');
    });

    test('400 si birthDate manquant', async () => {
        const res = await request(app).post('/v2/auth/register').send({
            email: 'nobirth@test.com',
            password: 'password123',
            consent: true,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/birthDate/);
    });

    test('400 si email manquant', async () => {
        const res = await request(app).post('/v2/auth/register').send({
            password: 'password123',
            consent: true,
            birthDate: '1990-01-15',
        });
        expect(res.status).toBe(400);
    });

    test('409 si email déjà utilisé', async () => {
        await request(app).post('/v2/auth/register').send({
            email: 'dupv2@test.com',
            password: 'pass1',
            consent: true,
            birthDate: '1990-01-01',
        });
        const res = await request(app).post('/v2/auth/register').send({
            email: 'dupv2@test.com',
            password: 'pass2',
            consent: true,
            birthDate: '1990-02-02',
        });
        expect(res.status).toBe(409);
    });
});

describe('POST /v2/auth/login', () => {
    beforeAll(async () => {
        await request(app).post('/v2/auth/register').send({
            email: 'loginv2@test.com',
            password: 'mypassword',
            consent: true,
            birthDate: '1985-05-20',
        });
    });

    test('login valide retourne un token', async () => {
        const res = await request(app).post('/v2/auth/login').send({
            email: 'loginv2@test.com',
            password: 'mypassword',
        });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    test('401 avec mauvais mot de passe', async () => {
        const res = await request(app).post('/v2/auth/login').send({
            email: 'loginv2@test.com',
            password: 'wrongpassword',
        });
        expect(res.status).toBe(401);
    });
});

describe('GET /v2/auth/users/:id', () => {
    test('400 si id invalide', async () => {
        const res = await request(app).get('/v2/auth/users/abc');
        expect(res.status).toBe(400);
    });

    test('404 si utilisateur inexistant', async () => {
        const res = await request(app).get('/v2/auth/users/99999');
        expect(res.status).toBe(404);
    });
});

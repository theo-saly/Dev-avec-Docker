import { Router } from 'express';
import { createUser, getUserById } from '../persistence/user';
import { authRateLimit, applyCommonAuthRoutes } from './authCommon';

const router = Router();

applyCommonAuthRoutes(router);

router.post('/register', authRateLimit, (req, res) => {
    const { email, password, consent } = req.body;
    if (!email || !password || consent === undefined) {
        return res.status(400).json({ error: 'Champs manquants' });
    }
    const consentBool =
        consent === true ||
        consent === 'true' ||
        consent === 1 ||
        consent === '1';
    const user = createUser(email, password, consentBool);
    if (!user) {
        return res
            .status(409)
            .json({ error: 'Un compte avec cet email existe déjà' });
    }
    res.status(201).json({
        id: user.id,
        email: user.email,
        consent: user.consent,
    });
});

router.get('/users/:id', (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
        return res
            .status(400)
            .json({ error: 'Identifiant utilisateur invalide' });
    }
    const user = getUserById(userId);
    if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouve' });
    }
    return res.json(user);
});

export default router;

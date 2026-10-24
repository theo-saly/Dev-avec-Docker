import { Router } from 'express';
import { createUserV2, getUserByIdV2 } from '../persistence/user';
import { authRateLimit, applyCommonAuthRoutes } from './authCommon';

const router = Router();

applyCommonAuthRoutes(router);

router.post('/register', authRateLimit, (req, res) => {
    const { email, password, consent, birthDate } = req.body;
    if (!email || !password || consent === undefined || !birthDate) {
        return res.status(400).json({
            error: 'Champs manquants (email, password, consent, birthDate)',
        });
    }
    const consentBool =
        consent === true ||
        consent === 'true' ||
        consent === 1 ||
        consent === '1';
    const user = createUserV2(email, password, consentBool, birthDate);
    if (!user) {
        return res
            .status(409)
            .json({ error: 'Un compte avec cet email existe déjà' });
    }
    res.status(201).json({
        id: user.id,
        email: user.email,
        consent: user.consent,
        birthDate: user.birthDate,
    });
});

router.get('/users/:id', (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
        return res
            .status(400)
            .json({ error: 'Identifiant utilisateur invalide' });
    }
    const user = getUserByIdV2(userId);
    if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouve' });
    }
    return res.json(user);
});

export default router;

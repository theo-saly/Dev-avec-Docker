import { requireAuth, requireAdmin } from '../middleware/auth';
import listEvents from '../controllers/listEvents';
import getEvent from '../controllers/getEvent';
import createEvent from '../controllers/createEvent';
import updateEvent from '../controllers/updateEvent';
import deleteEvent from '../controllers/deleteEvent';

export default (app) => {
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    app.get('/events', requireAuth, listEvents);
    app.get('/events/:id', requireAuth, getEvent);
    app.post('/events', requireAuth, requireAdmin, createEvent);
    app.put('/events/:id', requireAuth, requireAdmin, updateEvent);
    app.delete('/events/:id', requireAuth, requireAdmin, deleteEvent);
};

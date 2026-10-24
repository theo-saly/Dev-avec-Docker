import { requireAuth } from '../middleware/auth';
import bookTicket from '../controllers/bookTicket';
import listMyTickets from '../controllers/listMyTickets';
import cancelTicket from '../controllers/cancelTicket';
import getAvailability from '../controllers/getAvailability';

export default (app) => {
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    app.post('/tickets', requireAuth, bookTicket);
    app.get('/tickets/me', requireAuth, listMyTickets);
    app.delete('/tickets/:id', requireAuth, cancelTicket);
    app.get('/events/:id/availability', requireAuth, getAvailability);
};

import db from '../persistence';
import { publishEvent } from '../events/publisher';

export default async (req, res) => {
    const ticket = await db.getTicket(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Billet non trouvé' });
    if (ticket.userId !== req.user.id) {
        return res.status(403).json({ error: "Ce billet n'est pas le vôtre" });
    }

    await db.cancelTicket(ticket.id);
    await publishEvent('ticket-cancelled', {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        userId: String(ticket.userId),
        quantity: String(ticket.quantity),
    });

    res.send({ ...ticket, status: 'cancelled' });
};

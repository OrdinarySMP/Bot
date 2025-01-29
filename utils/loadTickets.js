import ticketState from '../states/TicketState.js';
import { apiFetch } from './apiFetch.js';

export const loadTickets = async () => {
  const response = await apiFetch('/ticket', {
    method: 'GET',
    query: {
      'filter[state]': 0,
    },
  });
  const data = await response.json();
  const tickets = data.data;
  const channelIds = {};
  tickets.forEach((ticket) => {
    channelIds[ticket.channel_id] = `${ticket.id}`;
  });
  ticketState.setChannelIds(channelIds);
};

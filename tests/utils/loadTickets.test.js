import { describe, it, vi, expect, beforeEach } from 'vitest';
import { loadTickets } from '../../utils/loadTickets';
import ticketState from '../../states/TicketState.js';
import { apiFetch } from '../../utils/apiFetch.js';

vi.mock('../../utils/apiFetch.js');

describe('loadTickets', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch tickets and set channelIds correctly', async () => {
    const mockTickets = [
      { id: 1, channel_id: 11 },
      { id: 2, channel_id: 22 },
    ];

    apiFetch.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: mockTickets }),
    });

    await loadTickets();

    expect(apiFetch).toHaveBeenCalledWith('/ticket', {
      method: 'GET',
      query: {
        'filter[state]': 0,
      },
    });

    expect(ticketState.getChannelIds()).toStrictEqual({
      11: '1',
      22: '2',
    });
  });
});

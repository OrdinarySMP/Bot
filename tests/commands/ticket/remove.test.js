import { expect, it, vi, beforeEach } from 'vitest';
import { execute } from '../../../commands/ticket/remove.js';
import ticketState from '../../../states/TicketState.js';

const user = {
  id: 123,
  name: 'test',
};

const interaction = {
  channelId: '132123123',
  options: {
    getUser: vi.fn().mockReturnValue(user),
  },
  channel: {
    permissionOverwrites: {
      delete: vi.fn(),
    },
  },
  reply: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

it('ignores none ticket channels', async () => {
  ticketState.addChannelId('1', '321321321');
  await execute(interaction);

  expect(interaction.reply).toBeCalledWith({
    content: 'This is not a ticket channel.',
    ephemeral: true,
  });
});

it('can execute', async () => {
  ticketState.addChannelId('1', '132123123');
  await execute(interaction);

  expect(interaction.channel.permissionOverwrites.delete).toBeCalledWith(user);

  expect(interaction.reply).toBeCalledWith({
    embeds: [
      {
        data: {
          color: 15762234,
          description: '[object Object] has been removed from [object Object]',
          title: 'Remove',
        },
      },
    ],
  });
});

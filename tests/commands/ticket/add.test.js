import { expect, it, vi, beforeEach } from 'vitest';
import { execute } from '../../../commands/ticket/add.js';
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
    send: vi.fn().mockReturnValue(
      Promise.resolve({
        delete: vi.fn(),
      })
    ),
    permissionOverwrites: {
      edit: vi.fn(),
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

  expect(interaction.channel.permissionOverwrites.edit).toBeCalledWith(user, {
    ViewChannel: true,
  });

  expect(interaction.reply).toBeCalledWith({
    embeds: [
      {
        data: {
          color: 15762234,
          description: '[object Object] has been added to [object Object]',
          title: 'Add',
        },
      },
    ],
  });
});

import { ChannelType, PermissionsBitField } from 'discord.js';
import { expect, it, vi, beforeEach } from 'vitest';
import { execute } from '../../../commands/ticket/setup.js';
import { apiFetch } from '../../../utils/apiFetch.js';

const createChannelMock = vi.fn();

const interaction = {
  deferReply: vi.fn(),
  guild: {
    id: 123,
    channels: {
      create: createChannelMock,
    },
    roles: {
      everyone: {
        id: 1,
      },
    },
  },
  editReply: vi.fn(),
  options: {
    getString: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

it('cancels if already setup', async () => {
  vi.mock('../../../utils/apiFetch.js');
  apiFetch.mockReturnValue(
    Promise.resolve({
      json: () =>
        Promise.resolve({
          data: {
            id: 1,
          },
        }),
    })
  );

  await execute(interaction);

  expect(interaction.editReply).toBeCalledWith({
    content: 'The setup is completed. Please use the helper panel.',
    ephemeral: true,
  });
});

it('can execute', async () => {
  vi.mock('../../../utils/apiFetch.js');
  apiFetch.mockReturnValue(
    Promise.resolve({
      json: () =>
        Promise.resolve({
          data: {
            id: null,
          },
        }),
      ok: true,
    })
  );

  createChannelMock
    .mockReturnValueOnce({
      id: 10,
      name: 'category-channel',
    })
    .mockReturnValueOnce({
      id: 11,
      name: 'transcript-channel',
    })
    .mockReturnValueOnce({
      id: 12,
      name: 'create-channel',
    });

  await execute(interaction);
  expect(interaction.options.getString).toHaveBeenCalledTimes(3);
  expect(interaction.options.getString).toHaveBeenNthCalledWith(
    1,
    'category-name'
  );
  expect(interaction.options.getString).toHaveBeenNthCalledWith(
    2,
    'transcript-channel-name'
  );
  expect(interaction.options.getString).toHaveBeenNthCalledWith(
    3,
    'create-channel-name'
  );

  expect(interaction.guild.channels.create).toHaveBeenCalledTimes(3);
  expect(interaction.guild.channels.create).toHaveBeenNthCalledWith(1, {
    name: 'tickets',
    type: ChannelType.GuildCategory,
    reason: 'Setup ticket system',
  });
  expect(interaction.guild.channels.create).toHaveBeenNthCalledWith(2, {
    name: 'transcripts',
    parent: {
      id: 10,
      name: 'category-channel',
    },
    reason: 'Setup ticket system',
    topic: 'Collection of ticket transcripts',
    permissionOverwrites: [
      {
        id: 1,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
  expect(interaction.guild.channels.create).toHaveBeenNthCalledWith(3, {
    name: 'create-a-ticket',
    parent: {
      id: 10,
      name: 'category-channel',
    },
    reason: 'Setup ticket system',
    topic: 'Create a ticket here',
  });

  expect(apiFetch).toHaveBeenCalledTimes(2);
  expect(apiFetch).toHaveBeenNthCalledWith(2, '/ticket/config/setup', {
    method: 'POST',
    body: {
      category_id: 10,
      transcript_channel_id: 11,
      create_channel_id: 12,
      guild_id: 123,
    },
  });

  expect(interaction.editReply).toBeCalledWith({
    content: 'tickets setup completed.',
    ephemeral: true,
  });
});

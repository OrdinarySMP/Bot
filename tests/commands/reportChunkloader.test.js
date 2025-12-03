import { expect, it, vi, beforeEach } from 'vitest';
import { execute } from '../../commands/reportChunkloader.js';
import { confirmAction } from '../../commands/utils/confirmAction.js';
import { hasPermission } from '../../commands/utils/hasPermission.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';

vi.mock('discord.js', async (importOriginal) => {
  const actual = await importOriginal();

  class MockEmbedBuilder {
    setColor = vi.fn().mockReturnThis();
    setTitle = vi.fn().mockReturnThis();
    setDescription = vi.fn().mockReturnThis();
    addFields = vi.fn().mockReturnThis();
    setThumbnail = vi.fn().mockReturnThis();
    setTimestamp = vi.fn().mockReturnThis();
    setFields = vi.fn().mockReturnThis();
  }

  const EmbedBuilderMock = vi.fn(function () {
    return new MockEmbedBuilder();
  });

  return {
    ...actual,
    EmbedBuilder: EmbedBuilderMock,
  };
});

const channelMock = vi.fn();

const interaction = {
  reply: vi.fn(),
  editReply: vi.fn(),
  guild: {
    channels: {
      cache: {
        get: vi.fn(() => ({
          send: channelMock,
        })),
      },
    },
  },
  channel: {
    send: vi.fn(),
  },
  user: {
    displayAvatarURL: vi.fn(() => null),
  },
  options: {
    getInteger: vi.fn((key) => key),
    getString: vi.fn((key) => key),
    getUser: vi.fn((key) => key),
  },
};

vi.mock('../../commands/utils/confirmAction.js', () => {
  return {
    confirmAction: vi.fn(),
  };
});

vi.mock('../../commands/utils/hasPermission.js', () => {
  return {
    hasPermission: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

it('can report chunkloader', async () => {
  interaction.options.getInteger = vi.fn(() => 8);
  interaction.options.getString = vi.fn((key) => {
    if (key === 'dimension') {
      return 'overworld';
    }
    if (key === 'additional') {
      return 'testing';
    }
  });
  interaction.options.getUser = vi.fn(() => null);

  hasPermission.mockReturnValue(Promise.resolve(false));
  confirmAction.mockReturnValue(Promise.resolve(true));

  await execute(interaction);
  const embedBuilderInstance = EmbedBuilder.mock.results[0].value;

  expect(embedBuilderInstance.setColor).toHaveBeenCalledWith('#00ff00');
  expect(embedBuilderInstance.setDescription).toHaveBeenCalledWith(
    '**Chunkloader from**: [object Object]\n\n**Dimension**: overworld\n\n**Additional information**:\n`testing`'
  );
  expect(embedBuilderInstance.addFields).toHaveBeenCalledWith([
    {
      inline: true,
      name: 'Overworld:',
      value:
        'X: 8\nY: 8\nZ: 8\n```/execute in minecraft:overworld run tp @s 8 8 8```',
    },
    {
      inline: true,
      name: 'Nether:',
      value:
        'X: 1\nY: 8\nZ: 1\n```/execute in minecraft:the_nether run tp @s 1 8 1```',
    },
  ]);

  expect(channelMock).toHaveBeenCalled();

  expect(interaction.editReply).toBeCalledWith({
    content: 'Thank you for reporting your chunkloader.',
    flags: MessageFlags.Ephemeral,
  });
});

it('can report chunkloader for Nether', async () => {
  interaction.options.getInteger = vi.fn(() => 8);
  interaction.options.getString = vi.fn((key) => {
    if (key === 'dimension') {
      return 'nether';
    }
    if (key === 'additional') {
      return 'testing';
    }
  });
  interaction.options.getUser = vi.fn(() => null);

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(true));

  await execute(interaction);
  const embedBuilderInstance = EmbedBuilder.mock.results[0].value;

  expect(embedBuilderInstance.setColor).toHaveBeenCalledWith('#ff0000');
  expect(embedBuilderInstance.setDescription).toHaveBeenCalledWith(
    '**Chunkloader from**: [object Object]\n\n**Dimension**: nether\n\n**Additional information**:\n`testing`'
  );
  expect(embedBuilderInstance.addFields).toHaveBeenCalledWith([
    {
      inline: true,
      name: 'Overworld:',
      value:
        'X: 64\nY: 8\nZ: 64\n```/execute in minecraft:overworld run tp @s 64 8 64```',
    },
    {
      inline: true,
      name: 'Nether:',
      value:
        'X: 8\nY: 8\nZ: 8\n```/execute in minecraft:the_nether run tp @s 8 8 8```',
    },
  ]);

  expect(channelMock).toHaveBeenCalled();

  expect(interaction.editReply).toBeCalledWith({
    content: 'Thank you for reporting your chunkloader.',
    flags: MessageFlags.Ephemeral,
  });
});

it('can report chunkloader for End', async () => {
  interaction.options.getInteger = vi.fn(() => 8);
  interaction.options.getString = vi.fn((key) => {
    if (key === 'dimension') {
      return 'end';
    }
    if (key === 'additional') {
      return null;
    }
  });
  interaction.options.getUser = vi.fn(() => null);

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(true));

  await execute(interaction);
  const embedBuilderInstance = EmbedBuilder.mock.results[0].value;

  expect(embedBuilderInstance.setColor).toHaveBeenCalledWith('#6a0dad');
  expect(embedBuilderInstance.setDescription).toHaveBeenCalledWith(
    '**Chunkloader from**: [object Object]\n\n**Dimension**: end'
  );
  expect(embedBuilderInstance.addFields).toHaveBeenCalledWith([
    {
      inline: true,
      name: 'End:',
      value:
        'X: 8\nY: 8\nZ: 8\n```/execute in minecraft:the_end run tp @s 8 8 8```',
    },
  ]);

  expect(channelMock).toHaveBeenCalled();

  expect(interaction.editReply).toBeCalledWith({
    content: 'Thank you for reporting your chunkloader.',
    flags: MessageFlags.Ephemeral,
  });
});

it('can report chunkloader for other if permissions', async () => {
  interaction.options.getInteger = vi.fn(() => 8);
  interaction.options.getString = vi.fn((key) => {
    if (key === 'dimension') {
      return 'overworld';
    }
    if (key === 'additional') {
      return 'testing';
    }
  });
  interaction.options.getUser = vi.fn(() => ({
    name: 'other member',
    displayAvatarURL: vi.fn(() => null),
  }));

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(true));

  await execute(interaction);

  expect(EmbedBuilder.mock.results).toHaveLength(1);
});

it('can not report chunkloader for other if no permissions', async () => {
  interaction.options.getInteger = vi.fn(() => 8);
  interaction.options.getString = vi.fn((key) => {
    if (key === 'dimension') {
      return 'end';
    }
    if (key === 'additional') {
      return null;
    }
  });
  interaction.options.getUser = vi.fn(() => ({
    name: 'other member',
    displayAvatarURL: vi.fn(() => null),
  }));

  hasPermission.mockReturnValue(Promise.resolve(false));

  await execute(interaction);

  expect(EmbedBuilder.mock.results).toHaveLength(0);

  expect(channelMock).not.toHaveBeenCalled();
});

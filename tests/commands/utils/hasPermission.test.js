import { expect, it, vi } from 'vitest';
import { hasPermission } from '../../../commands/utils/hasPermission.js';
import { MessageFlags } from 'discord.js';

const interaction = {
  memberPermissions: {
    has: vi.fn(),
  },
  reply: vi.fn(),
};

it('returns true if permission exists', async () => {
  interaction.memberPermissions.has.mockReturnValue(true);

  const result = await hasPermission(interaction, '123');

  expect(result).toBe(true);
});

it('returns false if permission is missing and sends message', async () => {
  interaction.memberPermissions.has.mockReturnValue(false);

  const result = await hasPermission(interaction, '123');

  expect(result).toBe(false);
  expect(interaction.reply).toBeCalledWith({
    content: 'insufficient permission',
    flags: MessageFlags.Ephemeral,
  });
});

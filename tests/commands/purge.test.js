import { expect, it, vi, beforeEach } from 'vitest';
import { execute } from '../../commands/purge.js';
import {
  getMembersToPurge,
  removeLinkedRoles,
  createEmbed,
  removeMemberRoles,
} from '../../commands/utils/purge.js';
import { confirmAction } from '../../commands/utils/confirmAction.js';
import { hasPermission } from '../../commands/utils/hasPermission.js';
import { MessageFlags } from 'discord.js';

vi.mock('../../commands/utils/purge.js', () => {
  return {
    getMembersToPurge: vi.fn(),
    createEmbed: vi.fn(),
    removeLinkedRoles: vi.fn(),
    removeMemberRoles: vi.fn(),
  };
});

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

const interaction = {
  reply: vi.fn(),
  options: {
    getSubcommand: vi.fn(),
  },
  memberPermissions: {
    has: vi.fn(),
  },
  channel: {
    send: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

it('can execute preview', async () => {
  interaction.options.getSubcommand.mockReturnValue('preview');
  getMembersToPurge.mockImplementation(() => [
    { nickname: 'Alice' },
    { nickname: 'Bob' },
    { nickname: '<@123>' },
    { nickname: 'Charlie' },
    { nickname: 'David' },
    { nickname: '_Eve_' },
  ]);

  const setDescriptionMock = vi.fn();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
  }));
  await execute(interaction);
  expect(getMembersToPurge).toBeCalledWith(interaction);
  expect(setDescriptionMock).toBeCalledWith('To be purged: 6 members');
  expect(interaction.reply).toBeCalledWith({
    embeds: expect.arrayContaining([]),
    flags: MessageFlags.Ephemeral,
  });
});

it('can execute execute', async () => {
  interaction.options.getSubcommand.mockReturnValue('execute');

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(true));

  removeMemberRoles.mockImplementation(() => [
    { nickname: 'Alice' },
    { nickname: 'Bob' },
    { nickname: '<@123>' },
    { nickname: 'Charlie' },
    { nickname: 'David' },
    { nickname: '_Eve_' },
  ]);

  const setDescriptionMock = vi.fn();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalled();

  expect(removeMemberRoles).toBeCalled();
  expect(removeLinkedRoles).toBeCalled();

  expect(interaction.channel.send).toBeCalledWith({
    embeds: expect.any(Array),
  });
});

it('stops execute if no permissions', async () => {
  interaction.options.getSubcommand.mockReturnValue('execute');

  hasPermission.mockReturnValue(Promise.resolve(false));
  confirmAction.mockReturnValue(Promise.resolve(true));

  removeMemberRoles.mockImplementation(() => [
    { nickname: 'Alice' },
    { nickname: 'Bob' },
    { nickname: '<@123>' },
    { nickname: 'Charlie' },
    { nickname: 'David' },
    { nickname: '_Eve_' },
  ]);

  const setDescriptionMock = vi.fn();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalledTimes(0);

  expect(removeMemberRoles).toHaveBeenCalledTimes(0);
  expect(removeLinkedRoles).toHaveBeenCalledTimes(0);

  expect(interaction.channel.send).toHaveBeenCalledTimes(0);
});

it('stops execute if canceled', async () => {
  interaction.options.getSubcommand.mockReturnValue('execute');

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(false));

  removeMemberRoles.mockImplementation(() => [
    { nickname: 'Alice' },
    { nickname: 'Bob' },
    { nickname: '<@123>' },
    { nickname: 'Charlie' },
    { nickname: 'David' },
    { nickname: '_Eve_' },
  ]);

  const setDescriptionMock = vi.fn();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalled();

  expect(removeMemberRoles).toHaveBeenCalledTimes(0);
  expect(removeLinkedRoles).toHaveBeenCalledTimes(0);

  expect(interaction.channel.send).toHaveBeenCalledTimes(0);
});

it('can execute remove-member', async () => {
  interaction.options.getSubcommand.mockReturnValue('remove-member');

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(true));

  removeMemberRoles.mockImplementation(() => [
    { nickname: 'Alice' },
    { nickname: 'Bob' },
    { nickname: '<@123>' },
    { nickname: 'Charlie' },
    { nickname: 'David' },
    { nickname: '_Eve_' },
  ]);

  const setDescriptionMock = vi.fn().mockReturnThis();
  const setTitleMock = vi.fn().mockReturnThis();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
    setTitle: setTitleMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalled();

  expect(removeMemberRoles).toBeCalled();

  expect(interaction.channel.send).toBeCalledWith({
    embeds: expect.any(Array),
  });
});

it('stops remove-member if no permissions', async () => {
  interaction.options.getSubcommand.mockReturnValue('execute');

  hasPermission.mockReturnValue(Promise.resolve(false));
  confirmAction.mockReturnValue(Promise.resolve(true));

  removeMemberRoles.mockImplementation(() => [
    { nickname: 'Alice' },
    { nickname: 'Bob' },
    { nickname: '<@123>' },
    { nickname: 'Charlie' },
    { nickname: 'David' },
    { nickname: '_Eve_' },
  ]);

  const setDescriptionMock = vi.fn().mockReturnThis();
  const setTitleMock = vi.fn().mockReturnThis();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
    setTitle: setTitleMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalledTimes(0);

  expect(removeMemberRoles).toHaveBeenCalledTimes(0);

  expect(interaction.channel.send).toHaveBeenCalledTimes(0);
});

it('stops remove-member if canceled', async () => {
  interaction.options.getSubcommand.mockReturnValue('execute');

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(false));

  removeMemberRoles.mockImplementation(() => [
    { nickname: 'Alice' },
    { nickname: 'Bob' },
    { nickname: '<@123>' },
    { nickname: 'Charlie' },
    { nickname: 'David' },
    { nickname: '_Eve_' },
  ]);

  const setDescriptionMock = vi.fn().mockReturnThis();
  const setTitleMock = vi.fn().mockReturnThis();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
    setTitle: setTitleMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalled();

  expect(removeMemberRoles).toHaveBeenCalledTimes(0);

  expect(interaction.channel.send).toHaveBeenCalledTimes(0);
});

it('can execute remove-linked', async () => {
  interaction.options.getSubcommand.mockReturnValue('remove-linked');

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(true));

  const setDescriptionMock = vi.fn().mockReturnThis();
  const setTitleMock = vi.fn().mockReturnThis();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
    setTitle: setTitleMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalled();

  expect(removeLinkedRoles).toBeCalled();

  expect(interaction.channel.send).toBeCalledWith('Removed all Linked Roles');
});

it('stops remove-linked if no permissions', async () => {
  interaction.options.getSubcommand.mockReturnValue('remove-linked');

  hasPermission.mockReturnValue(Promise.resolve(false));
  confirmAction.mockReturnValue(Promise.resolve(true));

  const setDescriptionMock = vi.fn().mockReturnThis();
  const setTitleMock = vi.fn().mockReturnThis();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
    setTitle: setTitleMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalledTimes(0);

  expect(removeLinkedRoles).toHaveBeenCalledTimes(0);

  expect(interaction.channel.send).toHaveBeenCalledTimes(0);
});

it('stops remove-linked if canceled', async () => {
  interaction.options.getSubcommand.mockReturnValue('remove-linked');

  hasPermission.mockReturnValue(Promise.resolve(true));
  confirmAction.mockReturnValue(Promise.resolve(false));

  const setDescriptionMock = vi.fn().mockReturnThis();
  const setTitleMock = vi.fn().mockReturnThis();
  createEmbed.mockImplementation(() => ({
    setDescription: setDescriptionMock,
    setTitle: setTitleMock,
  }));

  await execute(interaction);

  expect(hasPermission).toHaveBeenCalled();
  expect(confirmAction).toHaveBeenCalled();

  expect(removeLinkedRoles).toHaveBeenCalledTimes(0);

  expect(interaction.channel.send).toHaveBeenCalledTimes(0);
});

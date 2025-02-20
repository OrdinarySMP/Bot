import { expect, it, vi } from 'vitest';
import { replaceUser, replaceChannel } from '../../utils/mentions.js';

const getMembersMock = vi.fn();
const members = {
  cache: {
    get: getMembersMock,
  },
};

it('can replace user mentions', async () => {
  const mentionString =
    '<@123123123123123123> <@456456456456456456> <@789789798789789789>';
  getMembersMock
    .mockReturnValueOnce({
      user: {
        globalName: 'Global Name',
      },
    })
    .mockReturnValueOnce({
      user: {
        globalName: null,
        username: 'Username',
      },
    })
    .mockReturnValueOnce({
      user: {
        globalName: null,
        username: null,
      },
    });
  const result = replaceUser(mentionString, members);
  expect(result).toBe('Global Name Username <@789789798789789789>');
});

it('can replace channel mentions', async () => {
  const mentionString = '<#123123123123123123> <#456456456456456456>';
  getMembersMock
    .mockReturnValueOnce({
      name: 'Channel name',
    })
    .mockReturnValueOnce({
      name: null,
    });
  const result = replaceChannel(mentionString, members);
  expect(result).toBe('Channel name <#456456456456456456>');
});

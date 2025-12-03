import { sendLeaveMessage } from '../../utils/sendLeaveMessage.js';
import { it, vi, expect, beforeEach } from 'vitest';
import { EmbedBuilder, Role, Collection } from 'discord.js';
import dayjs from 'dayjs';

const rolesMock = [
  new Role('123', 'Member', '#00FF00'),
  new Role('456', '@everyone', '#FFFFFF'),
];

vi.mock('discord.js', () => {
  class MockEmbedBuilder {
    setColor = vi.fn().mockReturnThis();
    setTitle = vi.fn().mockReturnThis();
    setDescription = vi.fn().mockReturnThis();
    addFields = vi.fn().mockReturnThis();
    setThumbnail = vi.fn().mockReturnThis();
    setTimestamp = vi.fn().mockReturnThis();
  }

  const EmbedBuilderMock = vi.fn(function () {
    return new MockEmbedBuilder();
  });

  const Role = class {
    constructor(id, name, hexColor) {
      this.id = id;
      this.name = name;
      this.hexColor = hexColor;
    }
    toString() {
      return this.name;
    }
  };

  const Collection = class extends Map {
    filter(callback) {
      return new Collection([...this].filter(([, value]) => callback(value)));
    }

    find(callback) {
      return [...this.values()].find(callback);
    }

    toJSON() {
      return [...this.values()].map((role) => role.name);
    }
  };

  return {
    EmbedBuilder: EmbedBuilderMock,
    Role,
    Collection,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

it('sends a leave message with correct embed', () => {
  const channel = {
    send: vi.fn(),
  };

  const roles = new Collection([
    [rolesMock[0].id, rolesMock[0]],
    [rolesMock[1].id, rolesMock[1]],
  ]);

  const member = {
    user: {
      username: 'TestUser',
      displayName: 'TestDisplayName',
      avatarURL: vi.fn(() => 'https://example.com/avatar.png'),
    },
    nickname: 'TestNickname',
    joinedAt: dayjs().subtract(10, 'day'),
    roles: { cache: roles },
    guild: {
      roles: {
        cache: new Collection([[rolesMock[0].id, rolesMock[0]]]),
      },
    },
  };

  process.env.MEMBER_ROLE_ID = '123';

  sendLeaveMessage(channel, member);

  const embedBuilderInstance = EmbedBuilder.mock.results[0].value;

  expect(embedBuilderInstance.setColor).toHaveBeenCalledWith('#00FF00');
  expect(embedBuilderInstance.setTitle).toHaveBeenCalledWith(
    'TestUser left the Server'
  );
  expect(embedBuilderInstance.setDescription).toHaveBeenCalledWith(
    `${member} left`
  );
  expect(embedBuilderInstance.addFields).toHaveBeenCalledWith(
    { name: 'Nickname:', value: 'TestNickname', inline: true },
    { name: 'Displayname:', value: 'TestDisplayName', inline: true },
    { name: '\u200B', value: '\u200B' },
    {
      name: 'Roles:',
      value: 'Member',
      inline: true,
    },
    { name: 'Time on Server:', value: '10 days', inline: true }
  );
  expect(embedBuilderInstance.setThumbnail).toHaveBeenCalledWith(
    'https://example.com/avatar.png'
  );
  expect(embedBuilderInstance.setTimestamp).toHaveBeenCalled();

  expect(channel.send).toHaveBeenCalledWith({
    embeds: [embedBuilderInstance],
  });
});

it('should handle users without nicknames or roles gracefully', () => {
  const channel = {
    send: vi.fn(),
  };

  const member = {
    user: {
      username: 'TestUser',
      displayName: 'TestDisplayName',
      avatarURL: vi.fn(() => 'https://example.com/avatar.png'),
    },
    nickname: null,
    joinedAt: dayjs().subtract(10, 'day'),
    roles: {
      cache: new Collection([[rolesMock[1].id, rolesMock[1]]]),
    },
    guild: {
      roles: {
        cache: new Collection([[rolesMock[0].id, rolesMock[0]]]),
      },
    },
  };

  process.env.MEMBER_ROLE_ID = '123';

  sendLeaveMessage(channel, member);

  const embedBuilderInstance = EmbedBuilder.mock.results[0].value;

  expect(embedBuilderInstance.setColor).toHaveBeenCalledWith('FF0000');
  expect(embedBuilderInstance.setTitle).toHaveBeenCalledWith(
    'TestUser left the Server'
  );
  expect(embedBuilderInstance.setDescription).toHaveBeenCalledWith(
    `${member} left`
  );
  expect(embedBuilderInstance.addFields).toHaveBeenCalledWith(
    { name: 'Nickname:', value: '---', inline: true },
    { name: 'Displayname:', value: 'TestDisplayName', inline: true },
    { name: '\u200B', value: '\u200B' },
    {
      name: 'Roles:',
      value: '---',
      inline: true,
    },
    { name: 'Time on Server:', value: '10 days', inline: true }
  );
  expect(embedBuilderInstance.setThumbnail).toHaveBeenCalledWith(
    'https://example.com/avatar.png'
  );
  expect(embedBuilderInstance.setTimestamp).toHaveBeenCalled();

  expect(channel.send).toHaveBeenCalledWith({
    embeds: [embedBuilderInstance],
  });
});

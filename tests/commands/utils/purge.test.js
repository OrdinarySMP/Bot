import { it, vi, expect, beforeEach } from 'vitest';
import { EmbedBuilder, Collection } from 'discord.js';
import dayjs from 'dayjs';
import {
  createEmbed,
  getMembersToPurge,
  removeLinkedRoles,
  removeMemberRoles,
} from '../../../commands/utils/purge.js';
import { removeRole } from '../../../utils/roles.js';

vi.mock('discord.js', () => {
  class MockEmbedBuilder {
    setTitle = vi.fn().mockReturnThis();
    setColor = vi.fn().mockReturnThis();
    setDescription = vi.fn().mockReturnThis();
    setTimestamp = vi.fn().mockReturnThis();
    setFields = vi.fn().mockReturnThis();
  }

  const EmbedBuilderMock = vi.fn(function () {
    return new MockEmbedBuilder();
  });

  return {
    EmbedBuilder: EmbedBuilderMock,
  };
});
vi.mock('discord.js', () => {
  class MockEmbedBuilder {
    setColor = vi.fn().mockReturnThis();
    setTitle = vi.fn().mockReturnThis();
    setDescription = vi.fn().mockReturnThis();
    addFields = vi.fn().mockReturnThis();
    setThumbnail = vi.fn().mockReturnThis();
    setTimestamp = vi.fn().mockReturnThis();
    setFields = vi.fn().mockReturnThis();
  }

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

  const EmbedBuilderMock = vi.fn(function () {
    return new MockEmbedBuilder();
  });

  return {
    EmbedBuilder: EmbedBuilderMock,
    Role,
    Collection,
  };
});

vi.mock('../../../utils/roles.js', () => ({
  removeRole: vi.fn(),
}));

let interaction, memberRole, linkedRole, ImmunityRole;

beforeEach(() => {
  vi.clearAllMocks();

  linkedRole = { id: '67890' };
  ImmunityRole = { id: '13579' };

  memberRole = {
    id: '12345',
    members: new Collection([
      [
        '1',
        {
          id: '1',
          joinedTimestamp: dayjs().subtract(45, 'day'),
          roles: { cache: new Map() },
        },
      ],
      [
        '2',
        {
          id: '2',
          joinedTimestamp: dayjs().subtract(10, 'day'),
          roles: { cache: new Map() },
        },
      ],
      [
        '3',
        {
          id: '3',
          joinedTimestamp: dayjs().subtract(45, 'day'),
          roles: { cache: new Collection([['67890', linkedRole]]) },
        },
      ],
      [
        '4',
        {
          id: '4',
          joinedTimestamp: dayjs().subtract(45, 'day'),
          roles: { cache: new Collection([['13579', ImmunityRole]]) },
        },
      ],
    ]),
  };

  interaction = {
    guild: {
      roles: {
        cache: new Collection([
          ['12345', memberRole],
          ['67890', linkedRole],
          ['13579', ImmunityRole],
        ]),
      },
    },
    options: {
      getInteger: vi.fn().mockReturnValue(30),
    },
  };

  process.env.MEMBER_ROLE_ID = '12345';
  process.env.LINKED_ROLE_ID = '67890';
  process.env.PURGE_IMMUNITY_ROLE_ID = '13579';
  process.env.PURGE_PERIOD_IN_DAYS = 30;
});

it('can createEmbed', async () => {
  const members = ['Alice', 'Bob', '<@123>', 'Charlie', 'David', '_Eve_'];

  createEmbed(members);

  const embedBuilderInstance = EmbedBuilder.mock.results[0].value;
  expect(embedBuilderInstance.setTitle).toHaveBeenCalledWith('Purge');
  expect(embedBuilderInstance.setColor).toHaveBeenCalledWith('#ce361e');
  expect(embedBuilderInstance.setDescription).toHaveBeenCalledWith(
    `${members.length} members purged`
  );
  expect(embedBuilderInstance.setTimestamp).toHaveBeenCalled();
  expect(embedBuilderInstance.setFields).toHaveBeenCalledWith([
    {
      inline: true,
      name: '\u200B',
      value: '\\_Eve\\_\nAlice\u200B',
    },
    {
      inline: true,
      name: '\u200B',
      value: 'Bob\nCharlie\u200B',
    },
    {
      inline: true,
      name: '\u200B',
      value: 'David\n<@123>\u200B',
    },
  ]);
});

it('can getMembersToPurge', async () => {
  const members = await getMembersToPurge(interaction);
  expect(members.size).toBe(1);
  expect(members.entries().next().value[1].id).toBe('1');
});

it('removeLinkedRoles removes linked roles from all members', async () => {
  await removeLinkedRoles(interaction);

  memberRole.members.forEach((member) => {
    expect(removeRole).toHaveBeenCalledWith(member, linkedRole);
  });
  expect(removeRole).toHaveBeenCalledTimes(4);
});

it('removeMemberRoles removes member roles from filtered members', async () => {
  const filteredMembers = await removeMemberRoles(interaction);

  expect(filteredMembers.size).toBe(1);
  expect(removeRole).toHaveBeenCalledWith(filteredMembers.get('1'), memberRole);
  expect(removeRole).toHaveBeenCalledTimes(1);
});

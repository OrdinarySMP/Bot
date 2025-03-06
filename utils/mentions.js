import { MessageMentions } from 'discord.js';

export const replaceUser = (message, members) => {
  return message.replaceAll(
    MessageMentions.GlobalUsersPattern,
    (userMention) => {
      const matches = userMention.match(MessageMentions.UsersPattern);
      const member = members.cache.get(matches.groups.id);
      if (member.user.globalName ?? member.user.username) {
        return `@${member.user.globalName ?? member.user.username}`;
      }
      return userMention;
    }
  );
};

export const replaceChannel = (message, channels) => {
  return message.replaceAll(
    MessageMentions.GlobalChannelsPattern,
    (channelMention) => {
      const matches = channelMention.match(MessageMentions.ChannelsPattern);
      const channel = channels.cache.get(matches.groups.id);
      if (channel.name) {
        return `#${channel.name}`;
      }
      return channelMention;
    }
  );
};

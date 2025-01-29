import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import ticketState from '../../states/TicketState.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-remove')
  .setDescription('Remove a user from the current ticket')
  .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to remove from the ticket.')
      .setRequired(true)
  );

export const execute = async (interaction) => {
  const user = interaction.options.getUser('user');
  if (
    !Object.keys(ticketState.getChannelIds()).includes(interaction.channelId)
  ) {
    interaction.reply({
      content: 'This is not a ticket channel.',
      ephemeral: true,
    });
    return;
  }

  interaction.channel.permissionOverwrites.delete(user);

  interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor('#f0833a')
        .setTitle('Remove')
        .setDescription(`${user} has been removed from ${interaction.channel}`),
    ],
  });
};

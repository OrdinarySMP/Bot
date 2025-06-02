import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import ticketState from '../../states/TicketState.js';
import Logger from '../../utils/logger.js';
import { apiFetch } from '../../utils/apiFetch.js';
import { replyError } from '../../utils/replyError.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-remove')
  .setDescription('Remove a user from the current ticket')
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
    await interaction.reply({
      content: 'This is not a ticket channel.',
      ephemeral: true,
    });
    return;
  }
  const ticketId = ticketState.getChannelIds()[interaction.channelId];
  try {
    await interaction.deferReply();
    const response = await apiFetch('/ticket', {
      method: 'GET',
      query: {
        'filter[id]': ticketId,
        include: 'ticketButton.ticketTeam.ticketTeamRoles',
      },
    });
    const ticket = await response.json();
    const ticketTeamRoleIds =
      ticket.data[0].ticket_button.ticket_team.ticket_team_roles.map(
        (ticketTeamRole) => ticketTeamRole.role_id
      );
    const hasRole = interaction.member.roles.cache.some((role) =>
      ticketTeamRoleIds.includes(role.id)
    );
    if (!hasRole) {
      await replyError(
        interaction,
        'You dont have the permission to remove a user from this ticket.'
      );
      return;
    }

    await interaction.channel.permissionOverwrites.delete(user);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#f0833a')
          .setTitle('Remove')
          .setDescription(
            `${user} has been removed from ${interaction.channel}`
          ),
      ],
    });
  } catch (error) {
    Logger.error(`Could not remove user from ticket: ${error}`);

    await replyError(
      interaction,
      'Could not remove user from this ticket. Please try again later. If this error persists, please report to the staff team.'
    );
  }
};

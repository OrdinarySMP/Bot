import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import ticketState from '../../states/TicketState.js';
import Logger from '../../utils/logger.js';
import { apiFetch } from '../../utils/apiFetch.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-add')
  .setDescription('Add a user to the current ticket')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to add to the ticket.')
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
      await interaction.reply({
        content: 'You dont have the permission to add a user to this ticket.',
        ephemeral: true,
      });
      return;
    }

    await interaction.channel.permissionOverwrites.edit(user, {
      ViewChannel: true,
    });

    const message = await interaction.channel.send(`${user}`);
    await message.delete();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#f0833a')
          .setTitle('Add')
          .setDescription(`${user} has been added to ${interaction.channel}`),
      ],
    });
  } catch (error) {
    Logger.error(`Could not add user to ticket: ${error}`);

    await interaction.reply({
      content:
        'Could not add the user to this ticket. Please try again later. If this error persists, please report to the staff team.',
      ephemeral: true,
    });
  }
};

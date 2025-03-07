import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import ticketState from '../../states/TicketState.js';
import Logger from '../../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-add')
  .setDescription('Add a user to the current ticket')
  .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
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
  try {
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

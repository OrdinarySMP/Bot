import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField,
} from 'discord.js';
import { apiFetch } from '../../utils/apiFetch.js';

export const data = new SlashCommandBuilder()
  .setName('tickets-setup')
  .setDescription('Setup for the Tickets')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((option) =>
    option.setName('category-name').setDescription('Name of the category.')
  )
  .addStringOption((option) =>
    option
      .setName('transcript-channel-name')
      .setDescription('Name of the transcript channel.')
  )
  .addStringOption((option) =>
    option
      .setName('create-channel-name')
      .setDescription('Name of the create a ticket channel.')
  );

export const execute = async (interaction) => {
  await interaction.deferReply({
    ephemeral: true,
  });

  const responseConfig = await apiFetch('/ticket/config', {
    method: 'GET',
    query: {
      'filter[guild_id]': interaction.guild.id,
    },
  });
  const ticketConfig = await responseConfig.json();

  if (ticketConfig.data?.id) {
    await interaction.editReply({
      content: 'The setup is completed. Please use the helper panel.',
      ephemeral: true,
    });
    return;
  }

  const categoryName =
    interaction.options.getString('category-name') ?? 'tickets';
  const transcriptChannelName =
    interaction.options.getString('transcript-channel-name') ?? 'transcripts';
  const createChannelName =
    interaction.options.getString('create-channel-name') ?? 'create-a-ticket';
  const everyoneRole = interaction.guild.roles.everyone;

  const category = await interaction.guild.channels.create({
    name: categoryName,
    type: ChannelType.GuildCategory,
    reason: 'Setup ticket system',
  });
  const transcriptChannel = await interaction.guild.channels.create({
    name: transcriptChannelName,
    parent: category,
    reason: 'Setup ticket system',
    topic: 'Collection of ticket transcripts',
    permissionOverwrites: [
      {
        id: everyoneRole.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
  const createChannel = await interaction.guild.channels.create({
    name: createChannelName,
    parent: category,
    reason: 'Setup ticket system',
    topic: 'Create a ticket here',
  });

  const response = await apiFetch('/ticket/config/setup', {
    method: 'POST',
    body: {
      category_id: category.id,
      transcript_channel_id: transcriptChannel.id,
      create_channel_id: createChannel.id,
      guild_id: interaction.guild.id,
    },
  });

  if (!response.ok) {
    await interaction.editReply({
      content:
        'An error occurred while setting up the ticket system. Please try again later. If this error persists, please report to the staff team.',
      ephemeral: true,
    });
    category.delete();
    transcriptChannel.delete();
    createChannel.delete();
    return;
  }

  await interaction.editReply({
    content: 'tickets setup completed.',
    ephemeral: true,
  });
};

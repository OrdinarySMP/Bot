import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from 'discord.js';

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

  // const response = await apiFetch('/ticket/setup', {
  //   method: 'POST',
  //   body: {
  //     category_id: category.id,
  //     transcript_channel_id: transcriptChannel.id,
  //     create_channel_id: createChannel.id,
  //     server_id: interaction.guild.id,
  //   },
  // });

  const confirm = new ButtonBuilder()
    .setCustomId('confirm')
    .setLabel('Support')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(confirm);

  const embed = new EmbedBuilder()
    .setColor('#f0833a')
    .setTitle("Click to open a ticket")
    .setDescription("Click on the button corresponding to the type of ticket you wish to open");
  await createChannel.send({
    components: [row],
    embeds: [embed],
  });

  await interaction.reply({
    content: 'tickets setup completed.',
    ephemeral: true,
  });
};

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { hasPermission } from './utils/hasPermission.js';
import { confirmAction } from './utils/confirmAction.js';
import Logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('report-chunkloader')
  .setDescription('Report a chunkloader')
  .addIntegerOption((option) =>
    option.setName('x').setDescription('The X coordinate.').setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName('y').setDescription('The Y coordinate.').setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName('z').setDescription('The Z coordinate.').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('dimension')
      .setDescription('The dimension of the chunkloader.')
      .setRequired(true)
      .addChoices(
        { name: 'Overworld', value: 'overworld' },
        { name: 'Nether', value: 'nether' },
        { name: 'End', value: 'end' }
      )
  )
  .addStringOption((option) =>
    option.setName('additional').setDescription('Additional information.')
  )
  .addUserOption((option) =>
    option.setName('member').setDescription('The owner of the chunkloader.')
  );

export const execute = async (interaction) => {
  const x = interaction.options.getInteger('x');
  const y = interaction.options.getInteger('y');
  const z = interaction.options.getInteger('z');
  const dimension = interaction.options.getString('dimension');
  const additional = interaction.options.getString('additional');
  const user = interaction.options.getUser('member') ?? interaction.user;

  if (
    user !== interaction.user &&
    !(await hasPermission(
      interaction,
      PermissionFlagsBits.ViewAuditLog,
      'You can not report a chunkloader for other members.'
    ))
  ) {
    return;
  }

  const coordinates = {
    Overworld: null,
    Nether: null,
    End: null,
  };
  let color = '';

  switch (dimension) {
    case 'overworld':
      color = '#00ff00';
      coordinates.Overworld = { x, y, z };
      coordinates.Nether = { x: Math.round(x / 8), y, z: Math.round(z / 8) };
      break;
    case 'nether':
      color = '#ff0000';
      coordinates.Nether = { x, y, z };
      coordinates.Overworld = { x: x * 8, y, z: z * 8 };
      break;
    case 'end':
      color = '#6a0dad';
      coordinates.End = { x, y, z };
      break;
  }

  const fields = Object.entries(coordinates)
    .filter(([, localCoordinates]) => localCoordinates !== null)
    .map(([localDimension, localCoordinates]) => {
      let tpDimension = '';
      switch (localDimension) {
        case 'Overworld':
          tpDimension = 'overworld';
          break;
        case 'Nether':
          tpDimension = 'the_nether';
          break;
        case 'End':
          tpDimension = 'the_end';
          break;
      }

      return {
        name: `${localDimension}:`,
        value:
          `X: ${localCoordinates.x}\nY: ${localCoordinates.y}\nZ: ${localCoordinates.z}\n` +
          '```/execute in minecraft:' +
          tpDimension +
          ' run tp @s ' +
          localCoordinates.x +
          ' ' +
          localCoordinates.y +
          ' ' +
          localCoordinates.z +
          '```',
        inline: true,
      };
    });

  const description = [
    `**Chunkloader from**: ${user}`,
    `**Dimension**: ${dimension}`,
    additional ? '**Additional information**:' + '\n`' + additional + '`' : '',
  ];

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description.filter((field) => field !== '').join('\n\n'))
    .addFields(fields)
    .setThumbnail(user.displayAvatarURL())
    .setTimestamp();

  const confirmed = await confirmAction(
    interaction,
    'Do you want to report this Chunkloader?',
    'Report',
    ButtonStyle.Success,
    [embed]
  );
  if (!confirmed) {
    return;
  }

  try {
    const channel = interaction.guild.channels.cache.get(
      process.env.CHUNKLOADER_CHANNEL
    );
    await channel.send({
      embeds: [embed],
    });
  } catch (e) {
    Logger.error(`Could not report chunkloader: ${e}`);
    await interaction.editReply({
      content:
        'An error occurred while reporting your chunkloader. Please try again later. If this error persists, please report to the staff team.',
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.editReply({
    content: 'Thank you for reporting your chunkloader.',
    flags: MessageFlags.Ephemeral,
  });
};

import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { confirmAction } from './utils/confirmAction.js';
import { hasPermission } from './utils/hasPermission.js';
import {
  createEmbed,
  getMembersToPurge,
  removeMemberRoles,
  removeLinkedRoles,
} from './utils/purge.js';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Monthly Member Purge')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('preview')
      .setDescription('preview purge')
      .addIntegerOption((option) =>
        option
          .setName('days')
          .setDescription('Number of days to preview')
          .setMinValue(1)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('execute')
      .setDescription('Remove inactive member roles and all linked roles')
      .addIntegerOption((option) =>
        option
          .setName('days')
          .setDescription('Number of days to purge')
          .setMinValue(1)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove-member')
      .setDescription('remove member role from inactive members')
      .addIntegerOption((option) =>
        option
          .setName('days')
          .setDescription('Number of days to remove members')
          .setMinValue(1)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove-linked')
      .setDescription('Remove linked role from all member')
  );

export const execute = async (interaction) => {
  const subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case 'preview':
      await previewPurge(interaction);
      break;
    case 'execute':
      await executePurge(interaction);
      break;
    case 'remove-member':
      await removeMembers(interaction);
      break;
    case 'remove-linked':
      await removeLinked(interaction);
      break;
    default:
      interaction.reply('command not found');
  }
};

const previewPurge = async (interaction) => {
  const filteredMembers = await getMembersToPurge(interaction);
  const members = filteredMembers?.map(
    (member) => `${member.nickname || member}`
  );

  const embed = createEmbed(members);
  embed.setDescription(`To be purged: ${members.length} members`);

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
};

const executePurge = async (interaction) => {
  if (!(await hasPermission(interaction, PermissionFlagsBits.BanMembers))) {
    return;
  }

  const confirmed = await confirmAction(
    interaction,
    'Do you really want to purge?',
    'Confirm purge'
  );
  if (!confirmed) {
    return;
  }

  const filteredMembers = await removeMemberRoles(interaction);
  const members = filteredMembers?.map(
    (member) => `${member.nickname || member}`
  );

  const embed = createEmbed(members);
  embed.setDescription(`${members.length} members purged`);

  await removeLinkedRoles(interaction);

  await interaction.channel.send({
    embeds: [embed],
  });
};

const removeMembers = async (interaction) => {
  if (!(await hasPermission(interaction, PermissionFlagsBits.BanMembers))) {
    return;
  }

  const confirmed = await confirmAction(
    interaction,
    'Do you really want to remove member roles?',
    'Confirm member removal'
  );
  if (!confirmed) {
    return;
  }

  const filteredMembers = await removeMemberRoles(interaction);
  const members = filteredMembers?.map(
    (member) => `${member.nickname || member}`
  );

  const embed = createEmbed(members);
  embed
    .setTitle('Member role removal')
    .setDescription(`${members.length} member roles removed`);

  await interaction.channel.send({
    embeds: [embed],
  });

  return filteredMembers;
};

const removeLinked = async (interaction) => {
  if (!(await hasPermission(interaction, PermissionFlagsBits.BanMembers))) {
    return;
  }

  const confirmed = await confirmAction(
    interaction,
    'Do you really want to remove all assigned linked roles?',
    'Confirm linked removal'
  );
  if (!confirmed) {
    return;
  }

  await removeLinkedRoles(interaction);

  await interaction.channel.send('Removed all Linked Roles');
};

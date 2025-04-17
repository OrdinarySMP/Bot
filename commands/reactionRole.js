import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import Logger from '../utils/logger.js';
import Paginate from './utils/paginate.js';
import { apiFetch } from '../utils/apiFetch.js';

export const data = new SlashCommandBuilder()
  .setName('reaction-role')
  .setDescription('Handles reaction roles on the server')
  .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Adds a reaction role to a message.')
      .addStringOption((option) =>
        option
          .setName('message')
          .setDescription('The message link to add the reaction to.')
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('emoji')
          .setDescription('The emoji to react with.')
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName('role')
          .setDescription('The role to assing/remove if reacted.')
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('list').setDescription('List all reaction roles.')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('Removes a reaction role.')
      .addStringOption((option) =>
        option
          .setName('reaction-role-id')
          .setDescription('The ID of the reactionrole to remove.')
          .setRequired(true)
      )
  );

export const execute = async (interaction) => {
  const subcommand = interaction.options.getSubcommand();
  switch (subcommand) {
    case 'add':
      addReactionRole(interaction);
      break;
    case 'list':
      listReactionRole(interaction);
      break;
    case 'remove':
      removeReactionRole(interaction);
      break;
    default:
      interaction.reply('command not found');
  }
};

const addReactionRole = async (interaction) => {
  const messageLink = interaction.options.getString('message');
  const emoji = interaction.options.getString('emoji');
  const role = interaction.options.getRole('role');

  try {
    const response = await apiFetch('/reaction-role', {
      method: 'POST',
      body: {
        message_link: messageLink,
        emoji: emoji,
        role_id: role.id,
      },
    });
    const createResponse = await response.json();

    if (createResponse.errors) {
      const errors = Object.entries(createResponse.errors)
        .map(([key, values]) => {
          return `**${key}**\n${values.join('\n')}`;
        })
        .join('\n\n');
      await interaction.reply({
        content: errors,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: 'Reaction role was created.',
      ephemeral: true,
    });
  } catch (e) {
    Logger.error(e);
    await interaction.reply({
      content: `An error occurred while creating the reaction role entry. Please try again later. If this error persists, please report to the staff team.`,
      ephemeral: true,
    });
  }
};

const listReactionRole = async (interaction) => {
  const response = await apiFetch('/reaction-role', {
    method: 'GET',
    query: {
      full: true,
    },
  });
  const reactionRoles = await response.json();
  if (!reactionRoles || !reactionRoles.data) {
    Logger.error(`Could not load reaction roles: ${reactionRoles}`);
    await interaction.reply({
      content: `An error occurred while fetching the reaction roles. Please try again later. If this error persists, please report to the staff team.`,
      ephemeral: true,
    });
  }

  const rolesOrderedByMessage = {};
  const embeds = [];
  for (const role of reactionRoles.data) {
    if (!rolesOrderedByMessage[role.message_id]) {
      let channel;
      let message;
      try {
        channel = await interaction.guild.channels.fetch(role.channel_id);
        message = await channel.messages.fetch(role.message_id);
      } catch (e) {
        // Unknown message || Unknown channel
        if (e.code === 10008 || e.code === 10003) {
          Logger.warning(
            `Message/Channel not found for Reaction role ${role.id}, ${e}`
          );
          continue;
        }
        Logger.error(
          `An error occoured while fetching the reaction roles: ${e}`
        );
        await interaction.reply({
          content:
            'An error occoured while fetching the reaction roles. Please try again later. If this error persists, please report to the staff team.',
          ephemeral: true,
        });
        return;
      }

      rolesOrderedByMessage[role.message_id] = {
        message,
        reactionRoles: [],
      };
    }
    role.role = await interaction.guild.roles.cache.find(
      (guildRole) => guildRole.id === role.role_id
    );
    rolesOrderedByMessage[role.message_id].reactionRoles.push(role);
  }

  Object.values(rolesOrderedByMessage).forEach((value) => {
    const embed = new EmbedBuilder()
      .setTitle('Reaction roles')
      .setDescription(`Reaction roles for: ${value.message.url}`)
      .setTimestamp();

    value.reactionRoles.forEach((reactionRole) => {
      embed.addFields({
        name: `ID: ${reactionRole.id}`,
        value: `Emoji: ${reactionRole.emoji}\n Role: ${reactionRole.role}`,
      });
    });

    embeds.push(embed);
  });

  const pagination = new Paginate(interaction, embeds);
  await pagination.paginate();
};

const removeReactionRole = async (interaction) => {
  const reactionRoleId = interaction.options.getString('reaction-role-id');

  try {
    await apiFetch(`/reaction-role/${reactionRoleId}`, {
      method: 'DELETE',
    });

    await interaction.reply({
      content: 'The reaction role has been removed.',
      ephemeral: true,
    });
  } catch (e) {
    Logger.error(e);
    await interaction.reply({
      content: `An error occurred while removing the reaction role. Please try again later. If this error persists, please report to the staff team.`,
      ephemeral: true,
    });
  }
};

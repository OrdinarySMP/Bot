import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('ip')
  .setDescription('Get the bots ip address')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export const execute = async (interaction) => {
  const response = await fetch('https://api.ipify.org/');
  const ip = await response.text();
  await interaction.reply({
    content: 'Current ip: `' + ip + '`',
    flags: MessageFlags.Ephemeral,
  });
};

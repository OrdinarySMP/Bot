import { MessageFlags } from 'discord.js';

export const hasPermission = async (
  interaction,
  requiredPermissionFlag,
  message = 'insufficient permission'
) => {
  if (!interaction.memberPermissions.has(requiredPermissionFlag)) {
    await interaction.reply({
      content: message,
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
};

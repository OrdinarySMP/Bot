import { MessageFlags } from 'discord.js';

export const replyError = async (interaction, content) => {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({
      content,
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await interaction.reply({
      content,
      flags: MessageFlags.Ephemeral,
    });
  }
};

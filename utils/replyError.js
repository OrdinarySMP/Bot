export const replyError = async (interaction, content) => {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({
      content,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content,
      ephemeral: true,
    });
  }
};

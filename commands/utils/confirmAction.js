import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} from 'discord.js';

export const confirmAction = async (
  interaction,
  confirmMessage,
  confirmLabel,
  confirmStyle = ButtonStyle.Danger,
  embeds = null
) => {
  const confirm = new ButtonBuilder()
    .setCustomId('confirm')
    .setLabel(confirmLabel)
    .setStyle(confirmStyle);

  const cancel = new ButtonBuilder()
    .setCustomId('cancel')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(confirm, cancel);

  const response = await interaction.reply({
    content: confirmMessage,
    components: [row],
    embeds: embeds,
    flags: MessageFlags.Ephemeral,
  });
  const collectorFilter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: collectorFilter,
      time: 60_000,
    });

    if (confirmation.customId === 'confirm') {
      await confirmation.update({
        content: 'executing command',
        embeds: [],
        components: [],
      });
      return true;
    } else if (confirmation.customId === 'cancel') {
      await confirmation.update({
        content: 'Action cancelled',
        components: [],
        embeds: [],
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }
  } catch {
    await interaction.editReply({
      content: 'Confirmation not received within 1 minute, cancelling',
      components: [],
      embeds: [],
    });
    return false;
  }
};

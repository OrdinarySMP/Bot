import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export const confirmActionDm = async (
  channel,
  confirmMessage,
  confirmLabel,
  confirmationMessage
) => {
  const confirm = new ButtonBuilder()
    .setCustomId('confirm')
    .setLabel(confirmLabel)
    .setStyle(ButtonStyle.Success);

  const cancel = new ButtonBuilder()
    .setCustomId('cancel')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(confirm, cancel);

  const response = await channel.send({
    content: confirmMessage,
    components: [row],
    ephemeral: true,
  });
  const collectorFilter = (i) => i.user.id === channel.recipient.id;

  let confirmation;
  try {
    confirmation = await response.awaitMessageComponent({
      filter: collectorFilter,
      time: 60_000,
    });

    if (confirmation.customId === 'confirm') {
      await confirmation.update({
        content: confirmationMessage,
        components: [],
      });
      return true;
    } else if (confirmation.customId === 'cancel') {
      await confirmation.update({
        content: 'Action cancelled',
        components: [],
        ephemeral: true,
      });
      return false;
    }
  } catch {
    await response.edit({
      content: 'Confirmation not received within 1 minute, cancelling',
      components: [],
    });
    return false;
  }
};

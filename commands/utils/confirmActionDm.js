import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from 'discord.js';

export const confirmActionDm = async (
  channel,
  title,
  confirmMessage,
  confirmLabel,
  confirmationMessage,
  cancelMessage = "Action cancelled",
  originalMessage = null
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

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(confirmMessage)
    .setColor('#f0833a');

  const data = {
    content: '',
    embeds: [embed],
    components: [row],
  };
  let response = null;
  if (originalMessage) {
    response = await originalMessage.edit(data);
  } else {
    response = await channel.send(data);
  }

  let confirmation;
  try {
    confirmation = await response.awaitMessageComponent({
      time: 60_000,
    });

    if (confirmation.customId === 'confirm') {
      embed.setDescription(confirmationMessage);
      await confirmation.update({
        embeds: [embed],
        components: [],
      });
      return true;
    } else if (confirmation.customId === 'cancel') {
      embed.setDescription(cancelMessage)
        .setColor('#ce361e');
      await confirmation.update({
        embeds: [embed],
        components: [],
      });
      return false;
    }
  } catch {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription('Confirmation not received within 1 minute, cancelling')
      .setColor('#ce361e');
    await response.edit({
      embeds: [embed],
      components: [],
    });
    return false;
  }
};

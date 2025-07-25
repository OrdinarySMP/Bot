import Logger from '../utils/logger.js';

export const loadMessage = async (interaction, model) => {
  if (!model.channel_id || !model.message_id) {
    return;
  }
  try {
    const channel = await interaction.guild.channels.fetch(model.channel_id);
    return await channel.messages.fetch(model.message_id);
  } catch (e) {
    // Unknown message || Unknown channel
    if (e.code === 10008 || e.code === 10003) {
      Logger.warning(
        `Message/Channel not found for Reaction role ${model.id}, ${e}`
      );
    } else {
      Logger.error(`An error occoured while fetching the message: ${e}`);
    }
    return;
  }
};

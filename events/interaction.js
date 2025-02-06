import Logger from '../utils/logger.js';

export const autocompleteHandler = async (interaction) => {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    Logger.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    Logger.error(error);
  }
};

export const commandsHandler = async (interaction) => {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    Logger.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    Logger.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
};

export const modalHandler = async (interaction) => {
  const modal = interaction.client.modals.get(interaction.customId);
  if (interaction.customId.match(/^ticket-.?/)) {
    return;
  }

  if (!modal) {
    Logger.error(`No modal matching ${interaction.customId} was found.`);
    return;
  }

  try {
    await modal.handler(interaction);
  } catch (error) {
    Logger.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while handling the modal!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while handling the modal!',
        ephemeral: true,
      });
    }
  }
};

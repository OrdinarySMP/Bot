import Logger from '../utils/logger.js';
import { replyError } from '../utils/replyError.js';

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
    replyError(interaction, 'There was an error while executing this command!');
  }
};

import { SlashCommandBuilder } from 'discord.js';
import { apiFetch } from '../utils/apiFetch.js';
import { handleApplication } from './utils/apply/index.js';

export const data = new SlashCommandBuilder()
  .setName('apply')
  .setDescription('Start an application process')
  .addStringOption((option) =>
    option
      .setName('application')
      .setDescription('Application name')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const autocomplete = async (interaction) => {
  const inputValue = interaction.options.getFocused();

  const response = await apiFetch('/application', {
    method: 'GET',
    query: {
      'filter[name]': inputValue,
    },
  });
  const applicationResponse = await response.json();
  await interaction.respond(
    applicationResponse.data.map((application) => ({
      name: application.name,
      value: `${application.id}`,
    }))
  );
};

export const execute = async (interaction) => {
  const applicationId = interaction.options.getString('application');
  handleApplication(interaction, applicationId);
};

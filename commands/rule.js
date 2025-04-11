import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Logger from '../utils/logger.js';
import { apiFetch } from '../utils/apiFetch.js';

export const data = new SlashCommandBuilder()
  .setName('rule')
  .setDescription('Displays a rule')
  .addStringOption((option) =>
    option
      .setName('rule')
      .setDescription('The rule to display')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const autocomplete = async (interaction) => {
  const inputValue = interaction.options.getFocused();

  const response = await apiFetch('/rule', {
    method: 'GET',
    query: {
      'filter[name]': inputValue,
    },
  });
  const ruleResponse = await response.json();
  await interaction.respond(
    ruleResponse.data.map((rule) => ({
      name: `${rule.number}. ${rule.name}`,
      value: `${rule.id}`,
    }))
  );
};

export const execute = async (interaction) => {
  const ruleId = interaction.options.getString('rule');

  try {
    const response = await apiFetch('/rule', {
      method: 'GET',
      query: {
        'filter[id]': ruleId,
      },
    });
    const ruleResponse = await response.json();
    const requestedRule = ruleResponse?.data?.[0];

    if (!requestedRule) {
      await interaction.reply({
        content:
          'The rule was not found please try again later. If this error persists, please report to the staff team.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#f0833a')
      .setTitle(`${requestedRule.number}. ${requestedRule.name}`)
      .setDescription(requestedRule.rule);

    await interaction.reply({
      embeds: [embed],
    });
  } catch (e) {
    Logger.error(e);
    await interaction.reply({
      content: `An error occurred while retrieving the rule entry. Please try again later. If this error persists, please report to the staff team.`,
      ephemeral: true,
    });
  }
};

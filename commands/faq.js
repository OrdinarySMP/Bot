import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Logger from '../utils/logger.js';
import { apiFetch } from '../utils/apiFetch.js';

export const data = new SlashCommandBuilder()
  .setName('faq')
  .setDescription('Answers frequently asked questions')
  .addStringOption((option) =>
    option
      .setName('question')
      .setDescription('The FAQ category')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const autocomplete = async (interaction) => {
  const inputValue = interaction.options.getFocused();

  const response = await apiFetch('/faq', {
    method: 'GET',
    query: {
      'filter[question]': inputValue,
    },
  });
  const faqResponse = await response.json();
  await interaction.respond(
    faqResponse.data.map((faq) => ({ name: faq.question, value: `${faq.id}` }))
  );
};

export const execute = async (interaction) => {
  const faqId = interaction.options.getString('question');

  try {
    const response = await apiFetch('/faq', {
      method: 'GET',
      query: {
        'filter[id]': faqId,
      },
    });
    const faqResponse = await response.json();
    const askedFaq = faqResponse?.data?.[0];

    if (!askedFaq) {
      await interaction.reply({
        content:
          'The question was not found. Please try again later. If this error persists, please report to the staff team.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#f0833a')
      .setTitle(askedFaq.question)
      .setDescription(askedFaq.answer);

    await interaction.reply({
      embeds: [embed],
    });
  } catch (e) {
    Logger.error(e);
    await interaction.reply({
      content: `An error occurred while retrieving the FAQ entry. Please try again later. If this error persists, please report to the staff team.`,
      ephemeral: true,
    });
  }
};

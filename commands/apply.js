import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { confirmActionDm } from './utils/confirmActionDm.js';
import { Logger } from '../utils/index.js';
import dayjs from 'dayjs';
import {
  applicationStartedDmEmbed,
  closedDmEmbed,
  getApplicationEmbed,
} from './applyEmbeds.js';
import {
  submitAnswer,
  createApplicationSubmission,
  getApplicationQuestions,
  submitApplicationSubmission,
  getAllApplicationSubmissions,
  getApplicationById,
} from './applyRequests.js';
import { apiFetch } from '../utils/apiFetch.js';

export const data = new SlashCommandBuilder()
  .setName('apply')
  .setDescription('Start an application process')
  .addStringOption((option) =>
    option
      .setName('application')
      .setDescription('The application you want to start')
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
  const member = interaction.member;
  const applicationId = interaction.options.getString('application');
  const application = await getApplicationById(applicationId)
  if (!application) {
    await interaction.reply({
      content: 'The application was not found. Please use the autocomplete. If this issue pressists contact the staff team.',
      ephemeral: true,
    });
    return
  }

  const channel = await member.createDM();
  try {
    await channel.send('Thank you for starting an application process');
  } catch (e) {
    Logger.error('cannot send direct message: ' + e);
    await interaction.reply({
      embeds: [closedDmEmbed],
      ephemeral: true,
    });
    return;
  }
  try {
    await interaction.reply({
      embeds: [applicationStartedDmEmbed],
      ephemeral: true,
    });

    const confirmed = await confirmActionDm(
      channel,
      application.confirmation_message,
      'Yes',
      `Thank you for applying. Your application process for ${application.name} has started.`
    );

    if (!confirmed) {
      await channel.send('Application process cancelled');
      return;
    }

    const applicationSubmission = await createApplicationSubmission(application.id, member.id);
    const questions = await getApplicationQuestions(application.id);

    const answerList = [];
    for (let i = 0; i < questions.length; i++) {
      const answer = await handleQuestionAnswer(
        application,
        channel,
        questions[i],
        applicationSubmission.id,
        i,
        questions.length
      );
      if (answer == null) {
        return;
      }
      answerList.push({ question: questions[i].question, answer });
    }

    const applications = await getAllApplicationSubmissions(application.id, member.id);
    const applicationAmount = applications.length;

    // TODO: don't hardcode
    const targetChannel =
      await interaction.client.channels.cache.get('1297505841070735362');
      // await interaction.client.channels.cache.get(application.log_channel);


    // TODO: needs to be moved to api to easily edit the message
    const message = await targetChannel.send({
      embeds: [
        getApplicationEmbed(
          application,
          answerList,
          member,
          dayjs(applicationSubmission.created_at),
          applicationAmount
        ),
      ],
    });

    await submitApplicationSubmission(applicationSubmission.id, message.url);

    channel.send(
      application.completion_message
    );
  } catch (error) {
    await handleError(
      channel,
      'An error occurred during the application process. Please try again later or contact the staff team.',
      `Application error: ${error.message}`
    );
  }
};

const handleQuestionAnswer = async (
  application,
  channel,
  question,
  applicationSubmissionId,
  questionNr,
  questionsLength
) => {
  const embed = new EmbedBuilder()
    .setTitle(
      `Application for ${application.name} question ${questionNr + 1}/${questionsLength}`
    )
    .setDescription(question.question)
    .setColor('#f0833a');

  await channel.send({
    embeds: [embed],
  });
  const collected = await channel.awaitMessages({
    max: 1,
    filter: (m) => !m.author.bot,
    // time: 600_000,
    time: 120_000,
  });

  if (collected.size === 0) {
    const embed = new EmbedBuilder()
      .setTitle(
        `Application timeout`
      )
      .setDescription('You did not provide an answer within the time limit. The application process has been cancelled.')
      .setColor('#ce361e');
    await channel.send({
      embeds: [embed]
    });
    return null;
  }

  let answer = collected.first().content;
  if (answer.length != 0) {
    answer += ' ';
  }
  collected.first().attachments.forEach((attachment) => {
    answer += attachment.url + ' ';
  });

  await submitAnswer(applicationSubmissionId, question.id, answer);
  return answer;
};

const handleError = async (channel, errorMessage, logMessage) => {
  const embed = new EmbedBuilder()
    .setTitle(
      `Error`
    )
    .setDescription(errorMessage)
    .setColor('#ce361e');
  await channel.send({
    embeds: [embed]
  });
  Logger.error(logMessage);
};

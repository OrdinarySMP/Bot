import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { confirmActionDm } from './utils/confirmActionDm.js';
import { Logger } from '../utils/index.js';
import {
  applicationStartedDmEmbed,
  closedDmEmbed,
} from './utils/apply/embeds.js';
import {
  submitAnswer,
  createApplicationSubmission,
  getApplicationQuestions,
  submitApplicationSubmission,
  getApplicationById,
  cancelApplicationSubmission,
} from './utils/apply/requests.js';
import { apiFetch } from '../utils/apiFetch.js';

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
  const member = interaction.member;
  const applicationId = interaction.options.getString('application');
  const application = await getApplicationById(applicationId);
  if (!application) {
    await interaction.reply({
      content:
        'The application was not found. Please use the autocomplete. If this issue pressists contact the staff team.',
      ephemeral: true,
    });
    return;
  }

  for (const restrictedRole of application.restricted_roles) {
    if (member.roles.cache.has(restrictedRole.role_id)) {
      await interaction.reply({
        content: 'You do not have the permission to execute that command.',
        ephemeral: true,
      });
      return;
    }
  }

  for (const requiredRole of application.required_roles) {
    if (!member.roles.cache.has(requiredRole.role_id)) {
      await interaction.reply({
        content: 'You do not have the permission to execute that command.',
        ephemeral: true,
      });
      return;
    }
  }

  const channel = await member.createDM();
  let originalMessage = null;
  try {
    originalMessage = await channel.send(
      'Thank you for starting an application process'
    );
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
      "Your Application for `" + application.name + "`",
      application.confirmation_message,
      'Yes',
      `Thank you for applying.\nYour application process for \`${application.name}\` has started.`,
      "Application cancelled",
      originalMessage
    );

    if (!confirmed) {
      return;
    }

    const applicationSubmission = await createApplicationSubmission(
      application.id,
      member.id
    );
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

    await submitApplicationSubmission(applicationSubmission.id);

    const embed = new EmbedBuilder()
      .setTitle(`Application for \`${application.name}\` completed`)
      .setDescription(application.completion_message)
      .setColor('#f0833a');
    channel.send({
      embeds: [embed],
    });
  } catch (error) {
    let message =
      'An error occurred during the application process. Please try again later or contact the staff team.';
    let logError = true;
    if (error.message === 'Application was cancelled.') {
      message =
        'Your prevoius application was cancelled in favor for your new application';
      logError = false;
    }
    await handleError(
      channel,
      message,
      `Application error: ${error.message}`,
      logError
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
      `Application for \`${application.name}\` question ${questionNr + 1}/${questionsLength}`
    )
    .setDescription(question.question)
    .setColor('#ffdbe5');

  await channel.send({
    embeds: [embed],
  });
  const collected = await channel.awaitMessages({
    max: 1,
    filter: (message) => {
      return (
        !message.author.bot && (message.content || message.attachments.size)
      );
    },
    time: 600_000,
  });

  if (collected.size === 0) {
    const embed = new EmbedBuilder()
      .setTitle(`Application timeout`)
      .setDescription(
        'You did not provide an answer within the time limit. The application process has been cancelled.'
      )
      .setColor('#ce361e');
    cancelApplicationSubmission(applicationSubmissionId);
    await channel.send({
      embeds: [embed],
    });
    return null;
  }

  let answer = collected.first().content;
  if (answer.length != 0) {
    answer += ' ';
  }
  let attachments = '';
  collected.first().attachments.forEach((attachment) => {
    attachments += attachment.url + ' ';
  });

  answer += attachments;

  await submitAnswer(applicationSubmissionId, question.id, answer, attachments);
  return answer;
};

const handleError = async (
  channel,
  errorMessage,
  logMessage,
  logError = true
) => {
  const embed = new EmbedBuilder()
    .setTitle(`Error`)
    .setDescription(errorMessage)
    .setColor('#ce361e');
  await channel.send({
    embeds: [embed],
  });
  if (logError) {
    Logger.error(logMessage);
  }
};

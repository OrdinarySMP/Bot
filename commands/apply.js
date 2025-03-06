import { SlashCommandBuilder } from 'discord.js';
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
  createApplication,
  getApplicationQuestions,
  submitApplication,
  getAllApplications,
} from './applyRequests.js';

const handleQuestionAnswer = async (channel, question, appId, questionNr, questionsLength) => {
  // TODO: send with question number in embed
  await channel.send(question.question);
  const collected = await channel.awaitMessages({
    max: 1,
    filter: (m) => !m.author.bot,
    // time: 600_000,
    time: 120_000,
  });

  if (collected.size === 0) {
    await channel.send('You did not provide an answer within the time limit. The application process has been cancelled.');
    return null;
  }

  let answer = collected.first().content;
  if (answer.length != 0) {
    answer += ' ';
  }
  collected.first().attachments.forEach((attachment) => {
    answer += attachment.url + ' ';
  });

  await submitAnswer(appId, question.id, answer);
  return answer;
};

const handleError = async (channel, errorMessage, logMessage) => {
  await channel.send(errorMessage);
  Logger.error(logMessage);
};

export const execute = async (interaction) => {
  // Logger.debug(Array.from(interaction.client.channels.cache.values()).map(channel => `${channel.name}: ${channel.id}`));
  const member = interaction.member;
  const application = interaction.options.getString('application');

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
      `Are you sure you want to start an application for ${application}?`,
      'Yes',
      'Thank you for applying. Your application process has started.'
    );

    if (!confirmed) {
      await channel.send('Application process cancelled');
      return;
    }

    const { appId, createdAt } = await createApplication(member.id);
    const questions = await getApplicationQuestions();
    // Logger.debug(createdAt);

    const answerList = [];
    for (let i = 0; i < questions.length; i++) {
      const answer = await handleQuestionAnswer(channel, questions[i], appId, i, questions.length);
      if (answer == null) {
        return;
      }
      answerList.push({ question: questions[i].question, answer });
    }

    const applications = await getAllApplications(member.id);
    // Logger.debug(applications);
    const applicationAmount = applications.length;

    const targetChannel = await interaction.client.channels.cache.get('818387863623565312');

    const message = await targetChannel.send({
      embeds: [
        getApplicationEmbed(
          answerList,
          member,
          dayjs(createdAt),
          applicationAmount,
        ),
      ],
    });

    await submitApplication(appId, message.url);

    channel.send('Thank you for submitting your Application. You will receive feedback once it has been processed.');



    // Logger.debug(`Application submitted successfully: ${message.id}`);
  } catch (error) {
    await handleError(
      channel,
      'An error occurred during the application process. Please try again later or contact the staff team.',
      `Application error: ${error.message}`
    );
  }
};

export const data = new SlashCommandBuilder()
  .setName('apply')
  .setDescription('Start an application process')
  .addStringOption((option) =>
    option
      .setName('application')
      .setDescription('The application you want to start')
      .setRequired(true)
      // TODO: don't hardcode
      .addChoices(
        { name: 'Member', value: 'member' },
        { name: 'EventManager', value: 'eventManager' },
        { name: 'Staff', value: 'staff' }
      )
  );

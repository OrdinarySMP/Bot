import { EmbedBuilder } from 'discord.js';
import { chunkText } from '../utils/chunkText.js';
import dayjs from 'dayjs';

export const closedDmEmbed = new EmbedBuilder()
  .setTitle('Error sending DM')
  .setColor('#ce361e')
  .setDescription(
    'I was unable to send you a DM. Please make sure your DMs are open and try again.\n' +
      "If you don't know how, [click here](https://support.discord.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings)"
  );

export const applicationStartedDmEmbed = new EmbedBuilder()
  .setTitle('Application Started')
  .setColor('#2e856e')
  .setDescription(
    'Your application process has been started. Please check your DMs for further instructions.'
  );

export const getApplicationEmbed = (
  application,
  answers,
  member,
  applicationStartTime,
  applicationCount
) => {
  const embed = new EmbedBuilder()
    .setTitle(`${member.displayName}'s application for ${application.name}`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp()
    .setColor('Yellow');

  let stats;
  try {
    // Add stats
    const now = dayjs();
    const applicationDuration = now.diff(applicationStartTime, 'seconds');
    const minutes = Math.floor(applicationDuration / 60);
    const seconds = applicationDuration % 60;
    const timeOnServer = dayjs(member.joinedAt).unix();

    stats =
      `**User ID:** ${member.id}\n` +
      `**Username:** ${member.user.username}\n` +
      `**User Mention:** ${member.toString()}\n` +
      `**Application Duration:** ${minutes} minutes ${seconds} seconds\n` +
      `**Time on Server:** <t:${timeOnServer}:R>\n` +
      `**Application Number:** ${applicationCount}`;

    let embedLength = stats.length;
    answers.forEach((answer) => {
      const question = answer.question;
      const answerChunks = chunkText(answer.answer);

      embed.addFields({
        name: '**' + question + '**',
        value: answerChunks[0],
      });
      embedLength += answerChunks[0].length;
      for (let i = 1; i < answerChunks.length; i++) {
        embed.addFields({
          name: '\u200B', // zero-width space
          value: answerChunks[i],
        });
        embedLength += answerChunks[i].length;
      }

      if (embedLength > 5000) {
        throw new Error('Invalid number value');
      }
    });

    embed.addFields({
      name: '**Application Stats**',
      value: stats,
    });
  } catch (e) {
    if (e.message == 'Invalid number value') {
      // Logger.debug(e);
      embed.setFields({
        name: '**Application too long**',
        value: 'Please view the application on the panel',
      });
      embed.addFields({
        name: '**Application Stats**',
        value: stats,
      });
    } else {
      throw e;
    }
  }

  return embed;
};

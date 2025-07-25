import {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
} from 'discord.js';
import {
  acceptApplicationSubmission,
  denyApplicationSubmission,
  getApplicationSubmissionHistory,
} from '../commands/utils/apply/requests.js';
import { loadMessage } from '../utils/loadMessage.js';
import Paginate from '../commands/utils/paginate.js';
import dayjs from 'dayjs';

export const applicationHandler = async (interaction) => {
  if (interaction.isModalSubmit()) {
    handleModal(interaction);
  }
  if (interaction.isButton()) {
    handleButtons(interaction);
  }
  if (interaction.isStringSelectMenu()) {
    handleSelectMenu(interaction);
  }
};

const handleModal = async (interaction) => {
  const match = interaction.customId.match(
    /^applicationSubmission-([^-]+)-([0-9]+)$/
  );
  if (!match) {
    return;
  }
  const action = match[1]; // action
  const id = match[2]; // id
  const reason = interaction.fields.getTextInputValue('reason');

  if (action === 'acceptWithReason') {
    await interaction.reply({
      content: 'Accepting application',
      ephemeral: true,
    });
    acceptApplicationSubmission(id, interaction.user.id, null, reason);
  }

  if (action === 'denyWithReason') {
    await interaction.reply({
      content: 'Denying application',
      ephemeral: true,
    });
    denyApplicationSubmission(id, interaction.user.id, null, reason);
  }
};

const handleButtons = async (interaction) => {
  const match = interaction.customId.match(
    /^applicationSubmission-([^-]+)-([0-9]+)$/
  );
  if (!match) {
    return;
  }
  const action = match[1]; // action
  const id = match[2]; // id

  if (action === 'accept') {
    await interaction.reply({
      content: 'Accepting application',
      ephemeral: true,
    });
    acceptApplicationSubmission(id, interaction.user.id);
  }

  if (action === 'deny') {
    await interaction.reply({
      content: 'Denying application',
      ephemeral: true,
    });
    denyApplicationSubmission(id, interaction.user.id);
  }

  if (action === 'acceptWithReason') {
    const modal = new ModalBuilder()
      .setCustomId(`applicationSubmission-acceptWithReason-${id}`)
      .setTitle('Accept application with reason');

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Reason:')
      .setStyle(TextInputStyle.Paragraph);

    const answerActionRow = new ActionRowBuilder().addComponents(reasonInput);

    modal.addComponents(answerActionRow);
    await interaction.showModal(modal);
  }

  if (action === 'denyWithReason') {
    const modal = new ModalBuilder()
      .setCustomId(`applicationSubmission-denyWithReason-${id}`)
      .setTitle('Deny application with reason');

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Reason:')
      .setStyle(TextInputStyle.Paragraph);

    const answerActionRow = new ActionRowBuilder().addComponents(reasonInput);

    modal.addComponents(answerActionRow);
    await interaction.showModal(modal);
  }

  if (action === 'history') {
    await interaction.deferReply({ ephemeral: true });

    const history = await getApplicationSubmissionHistory(id);

    const embeds = [];
    for (const submission of history) {
      const message = await loadMessage(interaction, submission);
      const name =
        submission.member?.nick ??
        submission.member?.user?.global_name ??
        submission.member?.user?.username ??
        submission.discord_id;

      const state =
        {
          0: 'In Progress',
          1: 'Pending',
          2: 'Accepted',
          3: 'Denied',
        }[submission.state] ?? 'Cancelled';

      const response =
        submission.custom_response ??
        submission.application_response?.response ??
        (submission.state === 2
          ? submission.application?.accept_message
          : submission.state === 3
            ? submission.application?.deny_message
            : '---');
      const createdAt = `<t:${dayjs(submission.created_at).unix()}:f>`;
      const submittedAt = submission.submitted_at
        ? `<t:${dayjs(submission.submitted_at).unix()}:f>`
        : '---';

      embeds.push(
        new EmbedBuilder()
          .setTitle(
            `Application from ${name} for ${submission.application.name}`
          )
          .addFields({
            name: `Status`,
            value: state,
          })
          .addFields({
            name: `Message`,
            value: `${message?.url ?? 'message not found'}`,
          })
          .addFields({
            name: `Response`,
            value: response,
          })
          .addFields({
            name: `Created at`,
            value: createdAt,
          })
          .addFields({
            name: `Submitted at`,
            value: submittedAt,
          })
          .setTimestamp()
      );
    }

    const pagination = new Paginate(interaction, embeds);
    await pagination.paginate();
  }
};

const handleSelectMenu = async (interaction) => {
  const match = interaction.customId.match(
    /^applicationSubmission-([^-]+)-([0-9]+)$/
  );
  if (!match) {
    return;
  }
  const action = match[1]; // action
  const applicationSubmissionid = match[2]; // id
  const templateId = interaction.values[0];

  if (action === 'acceptTemplate') {
    await interaction.reply({
      content: 'Accepting application',
      ephemeral: true,
    });
    acceptApplicationSubmission(
      applicationSubmissionid,
      interaction.user.id,
      templateId
    );
  }

  if (action === 'denyTemplate') {
    await interaction.reply({
      content: 'Denying application',
      ephemeral: true,
    });
    denyApplicationSubmission(
      applicationSubmissionid,
      interaction.user.id,
      templateId
    );
  }
};

import {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  acceptApplicationSubmission,
  denyApplicationSubmission,
} from '../commands/applyRequests.js';

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

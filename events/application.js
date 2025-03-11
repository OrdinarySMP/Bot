import {
  acceptApplicationSubmission,
  denyApplicationSubmission,
} from '../commands/applyRequests.js';

export const applicationHandler = async (interaction) => {
  if (interaction.isButton()) {
    handleButtons(interaction);
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
};

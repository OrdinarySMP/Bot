import Logger from '../utils/logger.js';

export const ticketButtonHandler = async (interaction) => {
  if (!interaction.isButton()) {
    return
  }

  const match = interaction.customId.match(/^ticket-([^-]+)-([0-9]+)$/);
  if (!match) {
    return
  }
  const action = match[1] // action
  const id = match[2] // id

  if (action === 'create') {
    // create a ticket
  }

  if (action === 'claim') {
    // claim existing ticket
  }

  if (action === 'close') {
    // close existing ticket
  }

  if (action === 'closeWithReason') {
    // close existing ticket with reason
  }
};

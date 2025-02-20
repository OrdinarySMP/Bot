import {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} from 'discord.js';
import { apiFetch } from '../utils/apiFetch.js';
import ticketState from '../states/TicketState.js';
import { replaceUser, replaceChannel } from '../utils/mentions.js';

export const ticketHandler = async (interaction) => {
  if (interaction.isModalSubmit()) {
    const modalMatch = interaction.customId.match(
      /^ticket-([0-9]+)-close-with-reason$/
    );
    if (!modalMatch) {
      return;
    }
    const ticketId = modalMatch[1]; // id

    await interaction.reply({
      content: 'this ticket will be closed.',
      ephemeral: true,
    });
    const reason = interaction.fields.getTextInputValue('reason');
    const response = await apiFetch(`/ticket/${ticketId}/close`, {
      method: 'POST',
      body: {
        closed_by_discord_user_id: interaction.user.id,
        closed_reason: reason,
      },
    });

    if (!response.ok) {
      interaction.editReply({
        content:
          'An error occurred while closing this ticket. Please try again later. If this error persists, please report to the staff team',
        ephemeral: true,
      });
    } else {
      ticketState.removeChannelId(interaction.channelId);
    }
  }

  if (interaction.isButton()) {
    const match = interaction.customId.match(/^ticket-([^-]+)-([0-9]+)$/);
    if (!match) {
      return;
    }
    const action = match[1]; // action
    const id = match[2]; // id

    if (action === 'create') {
      const response = await apiFetch('/ticket', {
        method: 'POST',
        body: {
          ticket_button_id: id,
          created_by_discord_user_id: interaction.user.id,
        },
      });
      const ticket = await response.json();
      if (response.ok) {
        ticketState.addChannelId(`${ticket.data.id}`, ticket.data.channel_id);
        interaction.reply({
          content: `Your ticket has been created: <#${ticket.data.channel_id}>.`,
          ephemeral: true,
        });
      } else {
        interaction.reply({
          content:
            'An error occurred while creating your ticket. Please try again later. If this error persists, please report to the staff team.',
          ephemeral: true,
        });
      }
    }

    if (action === 'close') {
      // close existing ticket
      await interaction.reply({
        content: 'this ticket will be closed.',
        ephemeral: true,
      });
      const response = await apiFetch(`/ticket/${id}/close`, {
        method: 'POST',
        body: {
          closed_by_discord_user_id: interaction.user.id,
        },
      });

      if (!response.ok) {
        interaction.editReply({
          content:
            'An error occurred while closing this ticket. Please try again later. If this error persists, please report to the staff team',
          ephemeral: true,
        });
      } else {
        ticketState.removeChannelId(interaction.channelId);
      }
    }

    if (action === 'closeWithReason') {
      // close existing ticket with reason

      const modal = new ModalBuilder()
        .setCustomId(`ticket-${id}-close-with-reason`)
        .setTitle('Close ticket with reason');

      const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Reason:')
        .setStyle(TextInputStyle.Paragraph);

      const answerActionRow = new ActionRowBuilder().addComponents(reasonInput);

      modal.addComponents(answerActionRow);
      await interaction.showModal(modal);
    }
  }
};

export const ticketMessageCreateHandler = async (message) => {
  addTranscript(message);
};

export const ticketMessageUpdateHandler = async (message) => {
  addTranscript(message.reactions.message);
};

const addTranscript = (message) => {
  if (Object.keys(ticketState.getChannelIds()).includes(message.channelId)) {
    const members = message.guild.members;
    const channels = message.guild.channels;
    const attachments = JSON.stringify(message.attachments);

    const embeds = message.embeds.map((embed) => ({
      ...embed.data,
      description: replaceChannel(
        replaceUser(embed.description, members),
        channels
      ),
      title: replaceChannel(replaceUser(embed.title, members), channels),
      fields: embed.fields.map((field) => ({
        ...field,
        name: replaceChannel(replaceUser(field.name, members), channels),
        value: replaceChannel(replaceUser(field.value, members), channels),
      })),
    }));

    const stickers = message.stickers.map((sticker) => sticker.name).join(', ');
    let messageContent = message.content;
    if (stickers) {
      messageContent += `\nStickers: ${stickers}`;
    }
    if (message.reference) {
      messageContent += `Forward from: ${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}`;
    }

    messageContent = replaceUser(messageContent, members);
    messageContent = replaceChannel(messageContent, channels);

    apiFetch('ticket/transcript', {
      method: 'POST',
      body: {
        ticket_id: ticketState.getChannelIds()[message.channelId],
        discord_user_id: message.author.id,
        message_id: message.id,
        message: messageContent,
        attachments: attachments,
        embeds: JSON.stringify(embeds),
      },
    });
  }
};

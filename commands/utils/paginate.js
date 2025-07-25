import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from 'discord.js';

export default class Paginate {
  #timeout = 60_000;
  #buttons = {
    previous: new ButtonBuilder()
      .setCustomId('paginate-previous')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⬅️'),
    next: new ButtonBuilder()
      .setCustomId('paginate-next')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('➡️'),
  };
  #actionRow = new ActionRowBuilder().addComponents(
    Object.values(this.#buttons)
  );

  #embeds = [];
  #page = 1;
  #maxPage = 1;
  #interaction = undefined;
  #payload = undefined;

  constructor(interaction, embeds, page = 1) {
    this.#embeds = embeds;
    this.#page = page;
    this.#maxPage = embeds.length;
    this.#interaction = interaction;
  }

  async paginate() {
    if (this.#embeds.length === 0) {
      if (this.#interaction.replied || this.#interaction.deferred) {
        this.#interaction.editReply({
          content: 'No data found!',
          ephemeral: true,
        });
      } else {
        this.#interaction.reply({
          content: 'No data found!',
          ephemeral: true,
        });
      }
      return this;
    }
    const message = await this.#render();

    this.collector = message.createMessageComponentCollector({
      filter: ({ customId }) =>
        ['previous', 'next'].some(
          (position) => this.#buttons[position]?.data.custom_id === customId
        ),
      time: this.#timeout,
      componentType: ComponentType.Button,
    });

    this.collector.on('collect', async (interaction) => {
      if (interaction.customId === this.#buttons.previous?.data.custom_id) {
        this.#goPrev(interaction);
      } else if (interaction.customId === this.#buttons.next?.data.custom_id) {
        this.#goNext(interaction);
      }
    });

    this.collector.on('end', () => {
      this.#interaction.editReply({
        content: 'Interaction expired.',
        components: [],
      });
    });

    return this;
  }

  #goPrev(interaction) {
    this.#page--;
    this.#render();
    interaction.update(this.#payload);
  }

  #goNext(interaction) {
    this.#page++;
    this.#render();
    interaction.update(this.#payload);
  }

  async #render() {
    const embed = this.#getEmbed();
    embed.setFooter({ text: `Page ${this.#page} of ${this.#maxPage}` });
    this.#payload = {
      content: !embed
        ? 'Could not load data please try again later. If this error persists, please report to the staff team.'
        : '',
      embeds: embed ? [embed] : [],
      ephemeral: true,
      components: embed ? [this.#actionRow] : [],
    };

    this.#buttons.next?.setDisabled(this.#page >= this.#maxPage);
    this.#buttons.previous?.setDisabled(this.#page <= 1);

    if (this.#interaction.replied || this.#interaction.deferred) {
      return await this.#interaction.editReply(this.#payload);
    }
    return await this.#interaction.reply(this.#payload);
  }

  #getEmbed() {
    return this.#embeds[this.#page - 1];
  }
}

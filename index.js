import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  ActivityType,
} from 'discord.js';
import {
  sendLeaveMessage,
  addRole,
  getCommands,
  deployCommands,
  Logger,
  loadTickets,
} from './utils/index.js';
import { commandsHandler, autocompleteHandler } from './events/interaction.js';
import {
  ticketHandler,
  ticketMessageCreateHandler,
  ticketMessageUpdateHandler,
  ticketMessageDeleteHandler,
} from './events/ticket.js';
import { applicationHandler } from './events/application.js';
import { handleReactionRole } from './events/reactionRole.js';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.MessageContent,
];
const partials = [Partials.Message, Partials.Channel, Partials.Reaction];

const client = new Client({ intents, partials });
client.commands = await getCommands();

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    commandsHandler(interaction);
  } else if (interaction.isAutocomplete()) {
    autocompleteHandler(interaction);
  }
  ticketHandler(interaction);
  applicationHandler(interaction);
});

client.on(Events.MessageCreate, async (message) => {
  ticketMessageCreateHandler(message);
});

client.on(Events.MessageUpdate, async (message) => {
  ticketMessageUpdateHandler(message);
});

client.on(Events.MessageDelete, async (message) => {
  ticketMessageDeleteHandler(message);
});

client.once(Events.ClientReady, (readyClient) => {
  Logger.debug(`Ready! Logged in as ${readyClient.user.tag}`);
  readyClient.user.setActivity('on play.ordinary-smp.com', {
    type: ActivityType.Playing,
  });
});

client.on(Events.GuildMemberRemove, (member) => {
  const channel = client.channels.cache.get(process.env.LEAVE_CHANNEL);
  sendLeaveMessage(channel, member);
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (process.env.JOIN_ROLE_ID) {
    addRole(member, process.env.JOIN_ROLE_ID);
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  handleReactionRole(reaction, user, 'add');
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  handleReactionRole(reaction, user, 'remove');
});

deployCommands();
loadTickets();
client.login(process.env.DISCORD_TOKEN);

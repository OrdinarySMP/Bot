import { it, vi, expect, beforeEach } from 'vitest';
import Paginate from '../../../commands/utils/paginate.js';
import { MessageFlags } from 'discord.js';

let mockInteraction;
let onMock;
let mockEmbeds = [{ setFooter: vi.fn() }, { setFooter: vi.fn() }];

beforeEach(() => {
  onMock = vi.fn();

  mockInteraction = {
    reply: vi.fn(),
    editReply: vi.fn(),
    update: vi.fn(),
  };

  mockInteraction.reply.mockResolvedValue({
    createMessageComponentCollector: vi.fn().mockReturnValue({
      on: onMock,
    }),
  });
});

it('should reply with "No data found!" if no embeds are provided', async () => {
  const paginator = new Paginate(mockInteraction, []);
  await paginator.paginate();

  expect(mockInteraction.reply).toHaveBeenCalledWith({
    content: 'No data found!',
    flags: MessageFlags.Ephemeral,
  });
});

it('should render the first embed correctly', async () => {
  const paginator = new Paginate(mockInteraction, mockEmbeds);
  await paginator.paginate();

  expect(mockEmbeds[0].setFooter).toHaveBeenCalledWith({
    text: 'Page 1 of 2',
  });

  expect(mockInteraction.reply).toHaveBeenCalledWith(
    expect.objectContaining({
      embeds: [mockEmbeds[0]],
      components: expect.any(Array),
    })
  );

  expect(onMock).toHaveBeenCalledTimes(2);

  expect(onMock).toHaveBeenNthCalledWith(1, 'collect', expect.any(Function));
  expect(onMock).toHaveBeenNthCalledWith(2, 'end', expect.any(Function));
});

it('should handle "previous" button interaction correctly', async () => {
  onMock = vi.fn((event, callback) => {
    if (event === 'collect') {
      callback({
        customId: 'paginate-previous',
        update: vi.fn(),
      });
    }
  });

  mockInteraction.reply.mockResolvedValue({
    createMessageComponentCollector: vi.fn().mockReturnValue({ on: onMock }),
  });

  const paginator = new Paginate(mockInteraction, mockEmbeds, 2);
  await paginator.paginate();

  expect(mockEmbeds[1].setFooter).toHaveBeenCalledWith({
    text: 'Page 2 of 2',
  });
  expect(mockEmbeds[0].setFooter).toHaveBeenCalledWith({
    text: 'Page 1 of 2',
  });

  expect(mockInteraction.reply).toHaveBeenCalledWith({
    embeds: [mockEmbeds[0]],
    components: expect.any(Array),
    content: '',
    flags: MessageFlags.Ephemeral,
  });
});

it('should handle "next" button interaction correctly', async () => {
  onMock = vi.fn((event, callback) => {
    if (event === 'collect') {
      callback({
        customId: 'paginate-next',
        update: vi.fn(),
      });
    }
  });

  mockInteraction.reply.mockResolvedValue({
    createMessageComponentCollector: vi.fn().mockReturnValue({ on: onMock }),
  });

  const paginator = new Paginate(mockInteraction, mockEmbeds, 1);
  await paginator.paginate();

  expect(mockEmbeds[0].setFooter).toHaveBeenCalledWith({
    text: 'Page 1 of 2',
  });
  expect(mockEmbeds[1].setFooter).toHaveBeenCalledWith({
    text: 'Page 2 of 2',
  });

  expect(mockInteraction.reply).toHaveBeenCalledWith({
    embeds: [mockEmbeds[1]],
    components: expect.any(Array),
    content: '',
    flags: MessageFlags.Ephemeral,
  });
});

it('should handle interaction expiration', async () => {
  onMock = vi.fn((event, callback) => {
    if (event === 'end') {
      callback();
    }
  });

  mockInteraction.reply.mockResolvedValue({
    createMessageComponentCollector: vi.fn().mockReturnValue({ on: onMock }),
  });

  const paginator = new Paginate(mockInteraction, mockEmbeds);
  await paginator.paginate();

  expect(mockInteraction.editReply).toHaveBeenCalledWith({
    content: 'Interaction expired.',
    components: [],
  });
});

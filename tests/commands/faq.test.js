import { expect, it, vi } from 'vitest';
import { execute, autocomplete } from '../../commands/faq.js';
import fetch from 'node-fetch';

const interaction = {
  options: {
    getFocused: vi.fn(),
    getString: vi.fn(),
  },
  respond: vi.fn(),
  reply: vi.fn(),
};

vi.mock('node-fetch');
fetch.mockReturnValue(
  Promise.resolve({
    json: () =>
      Promise.resolve({
        data: [
          {
            id: 1,
            question: 'Test',
            answer: 'Testing',
          },
          {
            id: 2,
            question: 'Abc',
            answer: 'Def',
          },
        ],
      }),
  })
);

it('can retrive autocomplete', async () => {
  interaction.options.getFocused.mockReturnValue('');
  await autocomplete(interaction);

  expect(interaction.respond).toBeCalledWith([
    { name: 'Test', value: '1' },
    { name: 'Abc', value: '2' },
  ]);
});

it('can execute', async () => {
  interaction.options.getString.mockReturnValue('1');
  await execute(interaction);

  expect(interaction.reply).toBeCalledWith({
    embeds: [
      {
        data: {
          color: 15762234,
          description: 'Testing',
          title: 'Test',
        },
      },
    ],
  });
});

it('returns error if faq is not found', async () => {
  fetch.mockReturnValue(
    Promise.resolve({
      json: () =>
        Promise.resolve({
          data: [],
        }),
    })
  );
  await execute(interaction);

  expect(interaction.reply).toBeCalledWith({
    content:
      'The question was not found. Please try again later. If this error persists, please report to the staff team.',
    ephemeral: true,
  });
});

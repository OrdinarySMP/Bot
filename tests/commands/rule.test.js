import { expect, it, vi } from 'vitest';
import { execute, autocomplete } from '../../commands/rule.js';
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
            id: 2,
            number: 1,
            name: 'Abc',
            rule: 'Def',
          },
          {
            id: 1,
            number: 2,
            name: 'Test',
            rule: 'Testing',
          },
        ],
      }),
  })
);

it('can retrive autocomplete', async () => {
  interaction.options.getFocused.mockReturnValue('');
  await autocomplete(interaction);

  expect(interaction.respond).toBeCalledWith([
    { name: '1. Abc', value: '2' },
    { name: '2. Test', value: '1' },
  ]);
});

it('can execute', async () => {
  interaction.options.getString.mockReturnValue('2');
  await execute(interaction);

  expect(interaction.reply).toBeCalledWith({
    embeds: [
      {
        data: {
          color: 15762234,
          description: 'Def',
          title: '1. Abc',
        },
      },
    ],
  });
});

it('return error if rule is not found', async () => {
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
      'The rule was not found please try again later. If this error persists, please report to the staff team.',
    ephemeral: true,
  });
});

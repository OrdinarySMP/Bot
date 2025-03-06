import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import Logger from '../../utils/logger.js';

let consoleLogMock, consoleErrorMock;

beforeEach(() => {
  consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('should log debug messages with correct format', () => {
  Logger.debug('This is a debug message');
  expect(consoleLogMock).toHaveBeenCalledWith(
    expect.stringMatching(
      /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[DEBUG\]: This is a debug message/
    )
  );
});

it('should log warning messages with correct format', () => {
  Logger.warning('This is a warning message');
  expect(consoleLogMock).toHaveBeenCalledWith(
    expect.stringMatching(
      /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[WARNING\]: This is a warning message/
    )
  );
});

it('should log error messages with correct format', () => {
  Logger.error('This is an error message');
  expect(consoleErrorMock).toHaveBeenCalledWith(
    expect.stringMatching(
      /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[ERROR\]: This is an error message/
    )
  );
});

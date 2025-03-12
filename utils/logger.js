/* eslint-disable no-console */
import dayjs from 'dayjs';

export default class Logger {
  static getCurrentTime() {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
  }

  static debug = (message) => {
    console.log(`[${Logger.getCurrentTime()}] [DEBUG]: ${message}`);
  };

  static warning = (message) => {
    console.log(`[${Logger.getCurrentTime()}] [WARNING]: ${message}`);
  };

  static error = (message) => {
    console.error(`[${Logger.getCurrentTime()}] [ERROR]: ${message}`);
  };
}

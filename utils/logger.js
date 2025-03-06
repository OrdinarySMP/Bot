/* eslint-disable no-console */

export default class Logger {
  static getCurrentTime() {
    const now = new Date();
    return now.toISOString();
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


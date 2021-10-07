import util from 'util'

import winston from 'winston'

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp(),
    winston.format.printf((info) => `[${info.timestamp}][${info.level}] - ${info.message}`)
  ),
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

function info(...msg: any[]): void {
  winstonLogger.info(util.format(...msg))
}

function error(...msg: any[]): void {
  winstonLogger.error(util.format(...msg))
}

export default {
  info,
  error,
}

import { Response } from 'express'
import logger from './logger'

function processClientError(response: Response, statusCode: number, message: string): void {
  logger.error('Client Error:', message)
  response.status(statusCode).json({ error: message })
}

export default processClientError

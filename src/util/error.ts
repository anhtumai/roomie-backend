import { Response } from 'express'
import logger from './logger'

function processClientError(
    response: Response,
    statusCode: number,
    message: string,
): Response<any, Record<string, any>> {
    logger.error('Client Error:', message)
    return response.status(statusCode).json({ error: message })
}

export default processClientError

import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

import logger from './logger'

function requestLogger(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    logger.info('Method:', request.method)
    logger.info('Path:  ', request.path)
    logger.info('Body:  ', request.body)
    logger.info('---')
    next()
}

function unknownEndpoint(request: Request, response: Response): void {
    response.status(404).json({ error: 'unknown endpoint' })
}

function errorHandler(
    error: Error,
    request: Request,
    response: Response,
    next: NextFunction,
): Response {
    logger.error(error.message)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            return response
                .status(401)
                .json({
                    error:
            'There is unique constraint violation, anew user cannot be created',
                })
        }
    } else if (error.name === 'JsonWebTokenError') {
        return response.status(401).json({ error: 'invalid token' })
    } else if (error.name === 'TokenExpiredError') {
        return response.status(401).json({ error: 'token expired' })
    }
    logger.error('Missing err', error)
    next(error)
}

function tokenExtractor(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        (request as any).token = authorization.substring(7)
    }
    next()
}

export default {
    requestLogger,
    tokenExtractor,
    unknownEndpoint,
    errorHandler,
}

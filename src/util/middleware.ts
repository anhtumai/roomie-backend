import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'

import accountModel from '../models/account'
import logger from './logger'
import processClientError from './error'
import { RequestAfterExtractor } from '../types/express-middleware'

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
    processClientError(response, 404, 'Unknown endpoint')
}

function errorHandler(
    error: Error,
    request: Request,
    response: Response,
    next: NextFunction,
): Response {
    logger.error(error.message)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logger.error('Prisma error', error)
        return processClientError(response, 400, 'error when working with database')
    } else if (error.name === 'JsonWebTokenError') {
        return processClientError(response, 401, 'invalid token')
    } else if (error.name === 'TokenExpiredError') {
        return processClientError(response, 401, 'token expired')
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

function paramsIdValidator(
    request: Request,
    response: Response,
    next: NextFunction,
): void | Response {
    const id = Number(request.params.id)
    if (isNaN(id)) {
        return processClientError(response, 400, 'Param ID must be number')
    }
    next()
}

async function accountExtractor(
    request: RequestAfterExtractor,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (request.token === undefined) {
            throw new jwt.JsonWebTokenError('Token is missing')
        }

        const decodedToken = jwt.verify((request as any).token, process.env.SECRET)
        if (typeof decodedToken === 'string') {
            throw new jwt.JsonWebTokenError('Token is invalid')
        }

        const accountId = (decodedToken as jwt.JwtPayload).id

        request.account = await accountModel.findJoinApartmentAccount({
            id: accountId,
        })

        if (!request.account) {
            processClientError(response, 403, 'Account doesn\'t exist')
            return
        }
    } catch (err) {
        next(err)
    }
    next()
}

export default {
    requestLogger,
    tokenExtractor,
    unknownEndpoint,
    errorHandler,
    accountExtractor,
    paramsIdValidator,
}

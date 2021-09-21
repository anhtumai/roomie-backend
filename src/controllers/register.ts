import { Router } from 'express'
import bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'

import accountModel from '../models/account'
import processClientError from '../util/error'
import logger from '../util/logger'

const registerRouter = Router()

registerRouter.post('/', async (req, res, next) => {
    const body = req.body

    if (!body.username || !body.name || !body.password) {
        const errorMessage = 'Invalid body'
        return processClientError(res, 400, errorMessage)
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    try {
        const newAccount = await accountModel.create(body.username, body.name, passwordHash)
        return res.status(201).json(newAccount)
    } catch (err) {
        logger.error(err)
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
                const errorMessage = 'ConditionNotMeet error: \
						User with the same name has already existed'
                return processClientError(res, 400, errorMessage)
            }
        }
        next(err)
    }
})

export default registerRouter

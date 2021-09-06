import { Router } from 'express'
import bcrypt from 'bcrypt'

import accountModel from '../models/account'
import processClientError from '../util/error'
import logger from '../util/logger'

const registerRouter = Router()

registerRouter.post('/', async (req, res, next) => {
    const body = req.body

    if (!body.password) {
        return processClientError(res, 400, 'Password is missing')
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    try {
        const newAccount = await accountModel.createAccount(
            body.username,
            body.name,
            passwordHash,
        )
        return res.status(201).json({
            msg: `Create new account ${newAccount.username} with name ${newAccount.name}`,
        })
    } catch (err) {
        logger.error(err)
        next(err)
    }
})

export default registerRouter

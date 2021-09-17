import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Router } from 'express'

import accountModel from '../models/account'
import processClientError from '../util/error'
import logger from '../util/logger'

const loginRouter = Router()

loginRouter.post('/', async (req, res, next) => {
    const body = req.body

    if (!body.username || !body.password) {
        return processClientError(res, 400, 'Username or password is missing')
    }

    try {
        const account = await accountModel.findAccount({ username: body.username })
        const passwordCorrect =
      account === null
          ? false
          : await bcrypt.compare(body.password, account.password)

        if (!(account && passwordCorrect)) {
            return processClientError(res, 401, 'Invalid username or password')
        }

        const accountForToken = {
            username: account.username,
            id: account.id,
        }

        const token = jwt.sign(accountForToken, process.env.SECRET, {
            expiresIn: 3 * 60 * 60,
        })

        res
            .status(200)
            .send({ token, username: account.username, name: account.name })
    } catch (err) {
        logger.error(err)
        next(err)
    }
})

export default loginRouter

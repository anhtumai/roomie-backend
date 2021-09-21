import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Router } from 'express'

import accountModel from '../models/account'
import processClientError from '../util/error'

const loginRouter = Router()

loginRouter.post('/', async (req, res, next) => {
    const body = req.body

    if (!body.username || !body.password) {
        const errorMessage = 'Invalid body: username or password is missing'
        return processClientError(res, 400, errorMessage)
    }

    try {
        const account = await accountModel.find({ username: body.username })
        const passwordCorrect =
      account === null ? false : await bcrypt.compare(body.password, account.password)

        if (!(account && passwordCorrect)) {
            const errorMessage = 'Auth error: invalid username or password'
            return processClientError(res, 401, errorMessage)
        }

        const accountForToken = {
            username: account.username,
            id: account.id,
        }

        const token = jwt.sign(accountForToken, process.env.SECRET, {
            expiresIn: 3 * 60 * 60,
        })

        res.status(200).send({ token, username: account.username, name: account.name })
    } catch (err) {
        next(err)
    }
})

export default loginRouter

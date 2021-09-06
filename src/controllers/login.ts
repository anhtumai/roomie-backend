import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Router } from 'express'

import accountModel from '../models/account'
import processClientError from '../util/error'

const loginRouter = Router()

loginRouter.post('/', async (req, res) => {
    const body = req.body

    const account = await accountModel.findAccountByUsername(body.username)
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
        expiresIn: 60 * 60,
    })

    res
        .status(200)
        .send({ token, username: account.username, name: account.name })
})

export default loginRouter

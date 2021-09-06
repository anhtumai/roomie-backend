import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Router } from 'express'

import { PrismaClient } from '.prisma/client'

import processClientError from '../util/error'

const prisma = new PrismaClient()

const loginRouter = Router()

loginRouter.post('/', async (req, res) => {
    const body = req.body

    const account = await prisma.account.findFirst({
        where: { username: body.username },
    })
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

import { Router } from 'express'
import bcrypt from 'bcrypt'

import { PrismaClient } from '@prisma/client'
import processClientError from '../util/error'

const prisma = new PrismaClient()

const registerRouter = Router()

registerRouter.post('/', async (req, res, next) => {
    const body = req.body

    if (!body.password) {
        return processClientError(res, 400, 'Password is missing')
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    try {
        const newAccount = await prisma.account.create({
            data: {
                username: body.username,
                name: body.name,
                password: passwordHash,
            },
        })
        console.log(newAccount)
        return res.status(201).json(newAccount)
    } catch (err) {
        console.log('catch this error hmmm')
        console.log(err)
        console.log(typeof err)
        console.log(err.code)
        next(err)
    }
})

export default registerRouter

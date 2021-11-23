import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Joi from 'joi'

import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import jwt_decode from 'jwt-decode'

import accountModel from '../models/account'
import processClientError from '../util/error'
import { RequestAfterExtractor } from '../types/express-middleware'

type UpdateAccountProperty = {
  name?: string
  username?: string
  password?: string
}

function isCreateAccountPropertyValid(accountProperty: any): boolean {
  const { name, username, password } = accountProperty
  if (typeof username !== 'string' || typeof name !== 'string' || typeof password !== 'string')
    return false
  if (username.length < 5 || name.length < 10 || password.length < 10) return false
  return true
}

function isUpdateAccountPropertyValid(updateAccountProperty: any): boolean {
  const schema = Joi.object({
    username: Joi.string().min(5),
    name: Joi.string().min(10),
    password: Joi.string().min(10),
  }).min(1)

  const validatedObject = schema.validate(updateAccountProperty)
  return validatedObject.error === undefined
}

async function parseUpdateAccountProperty(
  updateAccountProperty: any
): Promise<UpdateAccountProperty> {
  const result = { ...updateAccountProperty }
  if (typeof updateAccountProperty.password === 'string') {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(updateAccountProperty.password, saltRounds)
    result.password = passwordHash
  }
  return result
}

async function findJoinApartmentAccount(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json(req.account)
  } catch (err) {
    next(err)
  }
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      const errorMessage = 'Invalid username or password'
      return processClientError(res, 401, errorMessage)
    }

    const accountForToken = {
      username: account.username,
      id: account.id,
    }

    const token = jwt.sign(accountForToken, process.env.SECRET, {
      expiresIn: 3 * 60 * 60,
    })

    const decodedToken = jwt_decode(token)

    res.status(200).send({
      token,
      username: account.username,
      name: account.name,
      id: account.id,
      expiresAt: (decodedToken as any).exp,
    })
  } catch (err) {
    next(err)
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  const body = req.body

  if (!isCreateAccountPropertyValid(req.body)) {
    const errorMessage = 'Invalid body'
    return processClientError(res, 400, errorMessage)
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  try {
    const newAccount = await accountModel.create(body.username, body.name, passwordHash)
    res.status(201).json(newAccount)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const errorMessage = 'User with the same username has already existed'
        return processClientError(res, 400, errorMessage)
      }
    }
    next(err)
  }
}

async function update(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body
  const accountId = Number(req.params.id)

  if (accountId !== req.account.id) {
    const errorMessage = 'Forbidden error'
    return processClientError(res, 403, errorMessage)
  }
  if (!isUpdateAccountPropertyValid(req.body)) {
    const errorMessage = 'Invalid body'
    return processClientError(res, 400, errorMessage)
  }

  try {
    const updateAccountProperty = await parseUpdateAccountProperty(body)
    const updatedAccount = await accountModel.update({ id: accountId }, updateAccountProperty)

    const { id, name, username } = updatedAccount
    res.status(200).json({ id, name, username })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const errorMessage = 'User with the same username has already existed'
        return processClientError(res, 400, errorMessage)
      }
    }
    next(err)
  }
}

export default {
  findJoinApartmentAccount,
  login,
  create,
  update,
}

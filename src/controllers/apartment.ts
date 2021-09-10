import { Router } from 'express'
import { Prisma } from '@prisma/client'

import apartmentModel from '../models/apartment'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

const apartmentRouter = Router()

apartmentRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const apartment = await apartmentModel.find({
                adminId: req.account.id,
            })

            return res.status(200).json({ data: apartment })
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

apartmentRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const newApartment = await apartmentModel.create(
                req.body.name,
                req.account.id,
            )
            return res.status(201).json({ data: newApartment })
        } catch (err) {
            logger.error(err)
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === 'P2014') {
                    return processClientError(
                        res,
                        401,
                        'One account can only create one apartment',
                    )
                }
            }
            next(err)
        }
    },
)

apartmentRouter.delete(
    '/:id',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const id = Number(req.params.id)
        if (isNaN(id)) {
            return processClientError(res, 400, 'Apartment ID must be number')
        }
        const { account } = req

        try {
            const deletedApartment = await apartmentModel.find({ id })
            if (deletedApartment === null)
                return processClientError(
                    res,
                    404,
                    `Apartment with id ${id} does not exist`,
                )
            if (deletedApartment.adminId !== account.id) {
                return processClientError(
                    res,
                    403,
                    'User is forbidden to remove this apartment',
                )
            }
            await apartmentModel.deleteOne({ id })
            return res.status(204)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default apartmentRouter

import { Router } from 'express'
import { Prisma } from '@prisma/client'

import apartmentModel from '../models/apartment'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'
import membershipModel from '../models/membership'
import invitationModel from '../models/invitation'

const apartmentRouter = Router()

apartmentRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const apartment = await membershipModel.findApartment(req.account.id)
            if (apartment === null)
                return processClientError(
                    res,
                    404,
                    'This account is not member of any apartments',
                )
            return res.status(200).json(apartment)
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
        if (!req.body.name) {
            return processClientError(res, 400, 'Apartment name is missing')
        }
        try {
            const newApartment = await apartmentModel.create(
                req.body.name,
                req.account.id,
            )
            await membershipModel.create(req.account.id, newApartment.id)
            await invitationModel.deleteMany({ inviteeId: req.account.id })
            return res.status(201).json(newApartment)
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
            await membershipModel.deleteMany({ apartmentId: id })
            await apartmentModel.deleteOne({ id })
            return res.status(204).json()
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default apartmentRouter

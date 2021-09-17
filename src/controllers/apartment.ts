import { Router } from 'express'
import { Prisma } from '@prisma/client'

import apartmentModel from '../models/apartment'
import accountModel from '../models/account'
import middleware from '../util/middleware'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'
import invitationModel from '../models/invitation'

const apartmentsRouter = Router()

apartmentsRouter.post(
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
            await accountModel.update(
                { id: req.account.id },
                { apartment_id: newApartment.id },
            )
            await invitationModel.deleteMany({ invitee_id: req.account.id })
            return res.status(201).json(newApartment)
        } catch (err) {
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

apartmentsRouter.delete(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const id = Number(req.params.id)

        const { account } = req

        try {
            const toDeleteApartment = await apartmentModel.find({ id })
            if (toDeleteApartment === null)
                return processClientError(
                    res,
                    404,
                    `Apartment with id ${id} does not exist`,
                )
            if (toDeleteApartment.admin_id !== account.id) {
                return processClientError(
                    res,
                    403,
                    'User is forbidden to remove this apartment',
                )
            }
            await accountModel.updateMany(
                { apartment_id: toDeleteApartment.id },
                { apartment_id: null },
            )
            await apartmentModel.deleteOne({ id })
            return res.status(204).json()
        } catch (err) {
            next(err)
        }
    },
)

export default apartmentsRouter

import { Router } from 'express'
import { Prisma } from '@prisma/client'

import apartmentModel from '../models/apartment'
import accountModel from '../models/account'
import invitationModel from '../models/invitation'

import middleware from '../util/middleware'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

const apartmentsRouter = Router()

apartmentsRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        if (!req.body.name) {
            const errorMessage = 'Invalid body: apartment name is missing'
            return processClientError(res, 400, errorMessage)
        }
        try {
            const newApartment = await apartmentModel.create(req.body.name, req.account.id)
            await accountModel.update({ id: req.account.id }, { apartment_id: newApartment.id })
            await invitationModel.deleteMany({ invitee_id: req.account.id })
            return res.status(201).json(newApartment)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === 'P2014') {
                    const errorMessage = 'ConditionNotMeet error: \
							One account can only create one apartment'
                    return processClientError(res, 401, errorMessage)
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
            if (toDeleteApartment === null) {
                const errorMessage = 'NotFound error'
                return processClientError(res, 404, errorMessage)
            }
            if (toDeleteApartment.admin_id !== account.id) {
                const errorMessage = 'Forbidden error'
                return processClientError(res, 403, errorMessage)
            }

            const whereParams = { apartment_id: toDeleteApartment.id }
            const dataParams = { apartment_id: null }
            await accountModel.updateMany(whereParams, dataParams)
            await apartmentModel.deleteOne({ id })
            return res.status(204).json()
        } catch (err) {
            next(err)
        }
    },
)

export default apartmentsRouter

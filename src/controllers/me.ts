import { Router } from 'express'
import accountModel from '../models/account'
import apartmentModel from '../models/apartment'
import middleware from '../util/middleware'
import processClientError from '../util/error'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'

const meRouter = Router()

meRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const displayAccount = await accountModel.findDisplayAccount({
                id: req.account.id,
            })
            return res.status(200).json(displayAccount)
        } catch (err) {
            next(err)
        }
    },
)

meRouter.get(
    '/apartment',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const { apartment } = await accountModel.findDisplayAccount({
                id: req.account.id,
            })
            if (apartment === null) return res.status(204)
            const apartmentId = apartment.id

            const displayApartment = await apartmentModel.findDisplayApartment({
                id: apartmentId,
            })
            return res.status(200).json(displayApartment)
        } catch (err) {
            next(err)
        }
    },
)

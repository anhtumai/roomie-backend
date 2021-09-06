import { Router } from 'express'

import apartmentModel from '../models/apartment'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'

const apartmentRouter = Router()

apartmentRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const apartment = await apartmentModel.findApartment(req.account.id)
        console.log(apartment)
        return res.status(201).json(apartment)
    },
)

apartmentRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const newApartment = await apartmentModel.createApartment(
                req.body.name,
                req.account.id,
            )
            return res.status(201).json(newApartment)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default apartmentRouter

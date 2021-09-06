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
        if (apartment === null)
            return res.status(404).json({ error: 'No apartment for this user' })
        return res.status(200).json(apartment)
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

apartmentRouter.delete(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const deletedApartment = await apartmentModel.deleteApartment(
                req.account.id,
            )
            if (deletedApartment === null)
                return res.status(404).json({ error: 'No apartment for this user' })
            return res
                .status(200)
                .json({ msg: `Delete apartment ${deletedApartment.name}` })
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default apartmentRouter

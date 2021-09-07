import { Router } from 'express'
import { Prisma } from '@prisma/client'

import apartmentModel from '../models/apartment'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'

const apartmentRouter = Router()

apartmentRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const apartment = await apartmentModel.findApartment({
            adminId: req.account.id,
        })

        return res.status(200).json({ data: apartment })
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
            return res.status(201).json({ data: newApartment })
        } catch (err) {
            logger.error(err)
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === 'P2014') {
                    return res.status(401).json({
                        error: 'One account can only create one apartment',
                    })
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
            return res.status(400).json({ error: 'Apartment ID must be number' })
        }
        const { account } = req

        try {
            const deletedApartment = await apartmentModel.findApartment({ id })
            if (deletedApartment === null)
                return res
                    .status(404)
                    .json({ error: `Apartment with id ${id} doesnot exist` })
            if (deletedApartment.adminId !== account.id) {
                return res
                    .status(403)
                    .json({ error: 'User is forbidden to remove this apartment' })
            }
            await apartmentModel.deleteApartment(id)
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

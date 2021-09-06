import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

import middleware from '../util/middleware'

import { RequestAfterExtractor } from '../types/express-middleware'
import logger from '../util/logger'

const prisma = new PrismaClient()

const apartmentRouter = Router()

apartmentRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const apartment = await prisma.apartment.findFirst({
            where: {
                adminId: req.account.id as number,
            },
        })
        console.log(apartment)
        return res.status(201).json(apartment)
    },
)

apartmentRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const newApartment = await prisma.apartment.create({
                data: {
                    name: req.body.name,
                    Admin: {
                        connect: {
                            id: req.account.id,
                        },
                    },
                },
            })
            return res.status(201).json(newApartment)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default apartmentRouter

import { Router } from 'express'

import accountModel from '../models/account'
import apartmentModel from '../models/apartment'
import invitationModel from '../models/invitation'

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
            return res.status(200).json(req.account)
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
            const { apartment } = req.account
            if (!apartment) return res.status(204).json()
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

meRouter.get(
    '/invitations',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        try {
            const sentInvitations = await invitationModel.findMany({
                invitorId: req.account.id,
            })
            const receivedInvitations = await invitationModel.findMany({
                inviteeId: req.account.id,
            })
            return res.status(200).json({
                sent: sentInvitations,
                received: receivedInvitations,
            })
        } catch (err) {
            next(err)
        }
    },
)

export default meRouter

import { Router } from 'express'

import invitationModel from '../models/invitation'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'
import accountModel from '../models/account'
import apartmentModel from '../models/apartment'

const invitationRouter = Router()

invitationRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const accountId = req.account.id
        const queryInvitationsParams = {
            OR: [{ invitorId: accountId }, { inviteeId: accountId }],
        }
        const pendingInvitations = await invitationModel.findInvitations(
            queryInvitationsParams,
        )

        return res.status(200).json({ data: pendingInvitations })
    },
)

invitationRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const inviteeUsername = req.body.username
        const apartmentId = req.body.apartmentId

        if (inviteeUsername === req.account.username)
            return res.status(400).json({ error: 'You cannot invite yourself' })

        try {
            const invitee = await accountModel.findAccount({
                username: inviteeUsername,
            })
            if (invitee === null) {
                return res
                    .status(404)
                    .json({ error: `Username ${invitee} does not exist` })
            }

            // code to find apartment and verify that invitor is actually a member in that apartment
            const apartment = await apartmentModel.findApartment({ id: apartmentId })
            // verify that invitor is actually a member in that apartment

            const newInvitation = await invitationModel.createNewInvitation(
                req.account.id,
                invitee.id,
                apartmentId,
            )
            return res.status(204).json({ invitor: req.account, invitee, apartment })
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default invitationRouter

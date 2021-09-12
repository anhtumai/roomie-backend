import { Router } from 'express'

import invitationModel from '../models/invitation'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'
import accountModel from '../models/account'
import membershipModel from '../models/membership'
import processClientError from '../util/error'

const invitationRouter = Router()

invitationRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const accountId = req.account.id
        const queryInvitationsParams = {
            OR: [{ invitorId: accountId }, { inviteeId: accountId }],
        }
        try {
            const pendingInvitations = await invitationModel.findMany(
                queryInvitationsParams,
            )

            return res.status(200).json({ data: pendingInvitations })
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

invitationRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const inviteeUsername = req.body.username

        if (!req.body.username) {
            return processClientError(res, 400, 'Invitee username is missing')
        }

        if (inviteeUsername === req.account.username)
            return processClientError(res, 400, 'You cannot invite yourself')

        try {
            const invitee = await accountModel.findDisplayAccount({
                username: inviteeUsername,
            })
            if (invitee === null) {
                return processClientError(
                    res,
                    404,
                    `Username ${inviteeUsername} does not exist`,
                )
            }

            const apartment = await membershipModel.findApartment(req.account.id)

            // verify that invitor is actually a member in that apartment
            if (apartment === null) {
                return processClientError(
                    res,
                    404,
                    'You are not the member of any apartment',
                )
            }

            const newInvitation = await invitationModel.create(
                req.account.id,
                invitee.id,
                apartment.id,
            )
            return res.status(201).json(newInvitation)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

invitationRouter.post(
    '/:id/reject',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const invitationId = Number(req.params.id)
        if (isNaN(invitationId)) {
            return processClientError(res, 400, 'Invitation ID must be number')
        }
        try {
            const invitation = await invitationModel.find({
                id: invitationId,
            })
            if (invitation === null || invitation.invitee.id !== req.account.id) {
                return processClientError(
                    res,
                    403,
                    'You are forbidden to reject this invitation or this invitation does not exist',
                )
            }
            await invitationModel.deleteMany({ id: invitationId })
            return res.status(200).json({ msg: `Reject invitation ${invitationId}` })
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

invitationRouter.post(
    '/:id/accept',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const invitationId = Number(req.params.id)
        if (isNaN(invitationId)) {
            return processClientError(res, 400, 'Invitation ID must be number')
        }

        try {
            const invitation = await invitationModel.find({
                id: invitationId,
            })
            if (invitation === null || invitation.invitee.id !== req.account.id) {
                return processClientError(
                    res,
                    403,
                    'You are forbidden to accept this invitation or this invitation does not exist',
                )
            }

            await membershipModel.create(req.account.id, invitation.apartment.id)
            await invitationModel.deleteMany({ inviteeId: req.account.id })

            return res.status(200).json({ msg: `Accept invitation ${invitationId}` })
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

invitationRouter.post(
    '/:id/cancel',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const invitationId = Number(req.params.id)
        if (isNaN(invitationId)) {
            return processClientError(res, 400, 'Invitation ID must be number')
        }

        try {
            const invitation = await invitationModel.find({
                id: invitationId,
            })
            if (
                invitation === null ||
        invitation.invitor.username !== req.account.username
            ) {
                return processClientError(
                    res,
                    403,
                    'You are forbidden to cancel this invitation or this invitation does not exist',
                )
            }

            await invitationModel.deleteMany({ id: invitationId })

            return res.status(204).json()
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default invitationRouter

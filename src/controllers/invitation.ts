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
            const pendingInvitations = await invitationModel.find(
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
        const apartmentId = req.body.apartmentId

        if (inviteeUsername === req.account.username)
            return processClientError(res, 400, 'You cannot invite yourself')

        try {
            const invitee = await accountModel.findAccount({
                username: inviteeUsername,
            })
            if (invitee === null) {
                return processClientError(
                    res,
                    404,
                    `Username ${inviteeUsername} does not exist`,
                )
            }

            // verify that invitor is actually a member in that apartment
            if (
                !(await membershipModel.isMemberOfApartment(
                    req.account.id,
                    apartmentId,
                ))
            ) {
                return res.status(404).json({
                    error: 'You are not the member or the apartment id does not exist',
                })
            }

            const newInvitation = await invitationModel.create(
                req.account.id,
                invitee.id,
                apartmentId,
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
            return processClientError(res, 400, 'Apartment ID must be number')
        }
        try {
            const invitation = await invitationModel.find({
                id: invitationId,
            })
            if (invitation.invitee.id !== req.account.id) {
                return processClientError(
                    res,
                    403,
                    'You are forbidden to reject this invitation',
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
            return processClientError(res, 400, 'Apartment ID must be number')
        }

        console.log('Accept', invitationId)
        try {
            const invitation = await invitationModel.find({
                id: invitationId,
            })
            if (invitation.invitee.id !== req.account.id) {
                return res
                    .status(403)
                    .json({ error: 'You are forbidden to accept this invitation' })
            }

            await membershipModel.create(invitationId, invitation.apartment.id)
            await invitationModel.deleteMany({ inviteeId: invitationId })

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
            return processClientError(res, 400, 'Apartment ID must be number')
        }

        console.log('Cancel', invitationId)
        try {
            const invitation = await invitationModel.find({
                id: invitationId,
            })
            if (invitation.invitor.id !== req.account.id) {
                return processClientError(
                    res,
                    403,
                    'You are forbidden to cancel this invitation',
                )
            }

            await invitationModel.deleteMany({ id: invitationId })

            return res.status(204)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default invitationRouter

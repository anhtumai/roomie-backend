import { Router } from 'express'

import accountModel from '../models/account'
import invitationModel from '../models/invitation'

import middleware from '../util/middleware'
import processClientError from '../util/error'

import { RequestAfterExtractor } from '../types/express-middleware'

const invitationsRouter = Router()

invitationsRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const inviteeUsername = req.body.username

        if (!req.body.username) {
            return processClientError(res, 400, 'Invitee username is missing')
        }

        if (inviteeUsername === req.account.username)
            return processClientError(res, 400, 'You cannot invite yourself')

        if (!req.account.apartment) {
            return processClientError(
                res,
                404,
                'You are not the member of any apartments',
            )
        }
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

            if (invitee.apartment !== null) {
                return processClientError(
                    res,
                    400,
                    `Invitee ${inviteeUsername} is currently member of an apartment`,
                )
            }
            const newInvitation = await invitationModel.create(
                req.account.id,
                invitee.id,
                req.account.apartment.id,
            )
            return res.status(201).json(newInvitation)
        } catch (err) {
            next(err)
        }
    },
)

invitationsRouter.post(
    '/:id/reject',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const invitationId = Number(req.params.id)

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
            await invitationModel.deleteOne({ id: invitationId })
            return res.status(200).json({
                msg: `Reject invitation to ${invitation.apartment.name} from ${invitation.invitor.username}`,
            })
        } catch (err) {
            next(err)
        }
    },
)

invitationsRouter.post(
    '/:id/accept',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const invitationId = Number(req.params.id)

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

            await accountModel.update(
                { id: req.account.id },
                { apartmentId: invitation.apartment.id },
            )
            await invitationModel.deleteMany({ inviteeId: req.account.id })

            return res.status(200).json({
                msg: `Accept invitation to ${invitation.apartment.name} from ${invitation.invitor.username}`,
            })
        } catch (err) {
            next(err)
        }
    },
)

invitationsRouter.delete(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const invitationId = Number(req.params.id)

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
                    'You are forbidden to delete this invitation or this invitation does not exist',
                )
            }

            await invitationModel.deleteMany({ id: invitationId })

            return res.status(204).json()
        } catch (err) {
            next(err)
        }
    },
)

export default invitationsRouter

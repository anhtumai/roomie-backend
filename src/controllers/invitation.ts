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
            const errorMessage = 'Invalid body: Invitee username is missing'
            return processClientError(res, 400, errorMessage)
        }

        if (inviteeUsername === req.account.username) {
            const errorMessage = 'Invalid body: You cannot invite yourself'
            return processClientError(res, 400, errorMessage)
        }
        if (!req.account.apartment) {
            const errorMessage = 'ConditionNotMeet error: You are not the member of any apartments'
            return processClientError(res, 404, errorMessage)
        }
        try {
            const invitee = await accountModel.findJoinApartmentAccount({
                username: inviteeUsername,
            })
            if (invitee === null) {
                const errorMessage = `ConditionNotMeet error: ${inviteeUsername} does not exist`
                return processClientError(res, 404, errorMessage)
            }

            if (invitee.apartment !== null) {
                const errorMessage = `ConditionNotMeet error: ${inviteeUsername} \
				is currently member of an apartment`
                return processClientError(res, 400, errorMessage)
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
                const errorMessage = 'Forbidden error'
                return processClientError(res, 403, errorMessage)
            }
            await invitationModel.deleteOne({ id: invitationId })
            return res.status(200).json({
                msg: `Reject invitation to ${invitation.apartment.name} \
				from ${invitation.invitor.username}`,
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
                const errorMessage = 'Forbidden error'
                return processClientError(res, 403, errorMessage)
            }

            const whereParams = { id: req.account.id }
            const dataParams = { apartment_id: invitation.apartment.id }
            await accountModel.update(whereParams, dataParams)
            await invitationModel.deleteMany({ invitee_id: req.account.id })

            return res.status(200).json({
                msg: `Accept invitation to ${invitation.apartment.name} \
				from ${invitation.invitor.username}`,
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
            if (invitation === null || invitation.invitor.username !== req.account.username) {
                const errorMessage = 'Forbidden error'
                return processClientError(res, 403, errorMessage)
            }

            await invitationModel.deleteMany({ id: invitationId })

            return res.status(204).json()
        } catch (err) {
            next(err)
        }
    },
)

export default invitationsRouter

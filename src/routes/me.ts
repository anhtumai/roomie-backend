import { Router } from 'express'

import apartmentModel from '../models/apartment'
import invitationModel from '../models/invitation'
import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'

import middleware from '../util/middleware'
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
        const apartment = req.account.apartment
        if (!apartment) return res.status(204).json()
        try {
            const apartmentId = apartment.id

            const displayApartment =
        await apartmentModel.findJoinAdminNMembersApartment({
            id: apartmentId,
        })
            const memberIds = displayApartment.members.map((member) => member.id)
            const responseTaskRequests =
        await taskRequestModel.findResponseTaskRequests(memberIds)

            const responseTaskAssignments =
        await taskAssignmentModel.findResponseTaskAssignments(memberIds)

            return res.status(200).json({
                ...displayApartment,
                task_requests: responseTaskRequests,
                task_assignments: responseTaskAssignments,
            })
        } catch (err) {
            next(err)
        }
    },
)

meRouter.get(
    '/tasks',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const apartment = req.account.apartment
        if (!apartment) return res.status(204).json()
        const accountId = req.account.id
        try {
            const taskRequests = await taskRequestModel.findJoinTaskRequests({
                assigner_id: accountId,
            })

            const taskAssignments = await taskAssignmentModel.findJoinTaskAssignments(
                {
                    assigner_id: accountId,
                },
            )
            return res.status(200).json({
                requests: taskRequests,
                assignments: taskAssignments,
            })
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
                invitor_id: req.account.id,
            })
            const receivedInvitations = await invitationModel.findMany({
                invitee_id: req.account.id,
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

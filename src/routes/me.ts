import { Router } from 'express'

import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'

import accountController from '../controllers/account'
import apartmentController from '../controllers/apartment'
import invitationController from '../controllers/invitation'

import middleware from '../util/middleware'
import { RequestAfterExtractor } from '../types/express-middleware'

const meRouter = Router()

meRouter.get('/', middleware.accountExtractor, accountController.findJoinApartmentAccount)

meRouter.get('/apartment', middleware.accountExtractor, apartmentController.findJoinTasksApartment)

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

            const taskAssignments = await taskAssignmentModel.findJoinTaskAssignments({
                assigner_id: accountId,
            })
            return res.status(200).json({
                requests: taskRequests,
                assignments: taskAssignments,
            })
        } catch (err) {
            next(err)
        }
    },
)

meRouter.get('/invitations', middleware.accountExtractor, invitationController.findMany)

export default meRouter

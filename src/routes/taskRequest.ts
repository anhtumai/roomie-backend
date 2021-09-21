import { Router } from 'express'

import _ from 'lodash'

import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import processClientError from '../util/error'
import logger from '../util/logger'
import middleware from '../util/middleware'
import { RequestAfterExtractor } from '../types/express-middleware'

const taskRequestsRouter = Router()

async function createTaskAssignment(taskId: number): Promise<void> {
    try {
        const taskRequests = await taskRequestModel.findMany({ task_id: taskId })
        const requestStates = taskRequests.map((taskRequest) => taskRequest.state)

        if (!requestStates.every((state) => state === 'accepted')) {
            return
        }

        // Need to notify to the client side
        //
        console.log('Notify: All requests for task: taskId has been accepted')

        const assignmentCreateData = _.sortBy(taskRequests, ['assigner_id']).map((request, i) => ({
            task_id: taskId,
            assigner_id: request.assigner_id,
            order: i,
        }))

        await taskAssignmentModel.createMany(assignmentCreateData)
        await taskRequestModel.deleteMany({ task_id: taskId })

        console.log('Notify: Task Assignment is created')
    } catch (err) {
        logger.error(err)
    }
    return
}

taskRequestsRouter.patch(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskRequestId = Number(req.params.id)
        const newState = req.body.state

        const validRequestStates = ['pending', 'accepted', 'rejected']
        if (!validRequestStates.includes(newState)) {
            const errorMessage = 'Invalid body: Updated state must be either accepted or rejected'
            return processClientError(res, 400, errorMessage)
        }

        try {
            const taskRequest = await taskRequestModel.findJoinAssignerRequest({
                id: taskRequestId,
            })
            if (!taskRequest || taskRequest.assigner.id !== req.account.id) {
                const errorMessage = 'Forbidden error'
                return processClientError(res, 403, errorMessage)
            }
            const updatedTaskRequest = await taskRequestModel.update(
                { id: taskRequestId },
                { state: newState },
            )
            res.status(200).json({ msg: `Task request id ${taskRequestId} is now ${newState}` })
            await createTaskAssignment(updatedTaskRequest.task_id)
        } catch (err) {
            next(err)
        }
    },
)
export default taskRequestsRouter

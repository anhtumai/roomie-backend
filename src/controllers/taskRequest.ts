import { Router } from 'express'

import _ from 'lodash'

import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'
import logger from '../util/logger'
import middleware from '../util/middleware'

const taskRequestsRouter = Router()

async function createTaskAssignment(taskId: number): Promise<void> {
    try {
        const taskRequests = await taskRequestModel.findMany({ task_id: taskId })
        const requestStates = taskRequests.map((taskRequest) => taskRequest.state)

        console.log(taskRequests)
        if (!requestStates.every((state) => state === 'accepted')) {
            return
        }

        // Need to notify to the client side
        //
        console.log(taskRequests)

        const taskAssignmentCreateData = _.sortBy(taskRequests, [
            'assigner_id',
        ]).map((request, i) => ({
            task_id: taskId,
            assigner_id: request.assigner_id,
            order: i,
        }))

        await taskAssignmentModel.createMany(taskAssignmentCreateData)
        await taskRequestModel.deleteMany({ task_id: taskId })
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
            return processClientError(res, 400, 'Updated state is invalid')
        }

        try {
            const taskRequest = await taskRequestModel.findJoinAssignerRequest({
                id: taskRequestId,
            })
            if (!taskRequest || taskRequest.assigner.id !== req.account.id) {
                return processClientError(
                    res,
                    403,
                    'You dont have permission to patch this task request',
                )
            }
            const updatedTaskRequest = await taskRequestModel.update(
                { id: taskRequestId },
                { state: newState },
            )
            res
                .status(200)
                .json({ msg: `Task request id ${taskRequestId} is now ${newState}` })
            await createTaskAssignment(updatedTaskRequest.task_id)
        } catch (err) {
            next(err)
        }
    },
)
export default taskRequestsRouter

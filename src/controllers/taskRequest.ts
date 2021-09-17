import { Router } from 'express'

import taskRequestModel from '../models/taskRequest'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'
import middleware from '../util/middleware'

const taskRequestsRouter = Router()

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
            const taskRequest = await taskRequestModel.findDisplayRequest({
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
            return res
                .status(200)
                .json({ msg: `Task request id ${taskRequestId} is now ${newState}` })
        } catch (err) {
            next(err)
        }
    },
)

export default taskRequestsRouter

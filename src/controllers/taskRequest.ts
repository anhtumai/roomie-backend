import { Response, NextFunction } from 'express'

import pusher, { makeChannel, pusherConstant } from '../pusherConfig'

import _ from 'lodash'

import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import taskModel from '../models/task'
import accountModel from '../models/account'

import processClientError from '../util/error'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'

async function createTaskAssignments(taskId: number, apartmentId: number): Promise<void> {
  try {
    const taskRequests = await taskRequestModel.findMany({ task_id: taskId })
    const requestStates = taskRequests.map((taskRequest) => taskRequest.state)

    if (requestStates.length === 0 || !requestStates.every((state) => state === 'accepted')) {
      return
    }

    const assignmentCreateData = _.sortBy(taskRequests, ['assigner_id']).map((request, i) => ({
      task_id: taskId,
      assigner_id: request.assigner_id,
      order: i,
    }))

    await taskAssignmentModel.createMany(assignmentCreateData)
    await taskRequestModel.deleteMany({ task_id: taskId })

    const task = await taskModel.find({ id: taskId })
    const allMembers = await accountModel.findMany({ apartment_id: apartmentId })

    pusher.trigger(
      allMembers.map(({ id }) => makeChannel(id)),
      pusherConstant.TASK_EVENT,
      {
        state: pusherConstant.ASSIGNED_STATE,
        task: task?.name,
        assigners: assignmentCreateData.map(({ assigner_id }) => {
          const assigner = allMembers.find((member) => member.id === assigner_id)
          return assigner?.username
        }),
      }
    )
  } catch (err) {
    logger.error(err)
  }
  return
}

async function updateState(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskRequestId = Number(req.params.id)
  const newState = req.body.state

  let taskId = 0

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
      { state: newState }
    )
    res.status(200).json({ msg: `Task request id ${taskRequestId} is now ${newState}` })
    taskId = updatedTaskRequest.task_id
  } catch (err) {
    next(err)
  }

  await createTaskAssignments(taskId, Number(req.account.apartment?.id))
}

export default {
  updateState,
}

import { Response, NextFunction } from 'express'
import { TaskRequest } from '@prisma/client'

import _ from 'lodash'

import taskRequestModel, { changeTaskRequestsToAssignments } from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import taskModel from '../models/task'
import accountModel, { Profile } from '../models/account'

import taskRequestPusher from '../pusher/taskRequest'

import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'
import logger from '../util/logger'

async function createTaskAssignments(
  taskRequests: TaskRequest[],
  taskId: number,
  allMembers: Profile[]
) {
  const assignmentCreateData = _.sortBy(taskRequests, ['assignee_id']).map((request, i) => ({
    task_id: taskId,
    assignee_id: request.assignee_id,
    order: i,
  }))

  await changeTaskRequestsToAssignments(taskRequests, taskId)

  const task = await taskModel.find({ id: taskId })
  const assigneeUsernames = assignmentCreateData.map(({ assignee_id }) => {
    const assignee = allMembers.find((member) => member.id === assignee_id)
    return assignee?.username
  })
  await taskRequestPusher.notifyAfterChangingToTaskAssignment(
    allMembers,
    task.name,
    assigneeUsernames
  )
}

async function updateState(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskRequestId = Number(req.params.id)
  const newState = req.body.state

  const validRequestStates = ['pending', 'accepted', 'rejected']
  if (!validRequestStates.includes(newState)) {
    const errorMessage = 'Invalid body: Updated state must be either accepted or rejected'
    return processClientError(res, 400, errorMessage)
  }

  try {
    // query
    const taskRequest = await taskRequestModel.findJoinAssigneeRequest({
      id: taskRequestId,
    })
    if (!taskRequest || taskRequest.assignee.id !== req.account.id) {
      const errorMessage = 'Forbidden error'
      return processClientError(res, 403, errorMessage)
    }

    // mutation
    const updatedTaskRequest = await taskRequestModel.update(
      { id: taskRequestId },
      { state: newState }
    )
    res.status(200).json({ msg: `Task request id ${taskRequestId} is now ${newState}` })

    // post response
    try {
      // query
      const taskId = updatedTaskRequest.task_id
      const taskRequests = await taskRequestModel.findMany({ task_id: taskId })
      const requestStates = taskRequests.map((taskRequest) => taskRequest.state)

      if (requestStates.length === 0) {
        logger.error(`Task ID ${taskId} is no longer a task request`)
        return
      }

      const allMembers = await accountModel.findMany({
        apartment_id: Number(req.account.apartment?.id),
      })

      if (requestStates.every((state) => state === 'accepted')) {
        // mutation
        await createTaskAssignments(taskRequests, taskId, allMembers)
      } else {
        await taskRequestPusher.notifyAfterUpdatingState(
          allMembers,
          taskRequestId,
          newState,
          req.account
        )
      }
    } catch (err) {
      logger.error(err)
    }
  } catch (err) {
    next(err)
  }
}

export default {
  updateState,
}

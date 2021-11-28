import { Response, NextFunction } from 'express'
import { TaskRequest } from '@prisma/client'

import _ from 'lodash'

import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import taskModel from '../models/task'
import accountModel, { Profile } from '../models/account'

import processClientError from '../util/error'
import pusher, { makeChannel, pusherConstant } from '../pusherConfig'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'

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

  await taskAssignmentModel.createMany(assignmentCreateData)
  await taskRequestModel.deleteMany({ task_id: taskId })

  const task = await taskModel.find({ id: taskId })

  await pusher.trigger(
    allMembers.map(({ id }) => makeChannel(id)),
    pusherConstant.TASK_EVENT,
    {
      state: pusherConstant.ASSIGNED_STATE,
      task: task?.name,
      assignees: assignmentCreateData.map(({ assignee_id }) => {
        const assignee = allMembers.find((member) => member.id === assignee_id)
        return assignee?.username
      }),
    }
  )
}

async function notifyAfterUpdatingState(
  taskRequestId: number,
  updatedState: 'pending' | 'accepted' | 'rejected',
  notifiedMembers: Profile[]
) {
  await pusher.trigger(
    notifiedMembers.map(({ id }) => makeChannel(id)),
    pusherConstant.TASK_REQUEST_EVENT,
    {
      state: pusherConstant.ASSIGNED_STATE,
      taskRequest: {
        id: taskRequestId,
        state: updatedState,
      },
    }
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
    const taskRequest = await taskRequestModel.findJoinAssigneeRequest({
      id: taskRequestId,
    })
    if (!taskRequest || taskRequest.assignee.id !== req.account.id) {
      const errorMessage = 'Forbidden error'
      return processClientError(res, 403, errorMessage)
    }
    const updatedTaskRequest = await taskRequestModel.update(
      { id: taskRequestId },
      { state: newState }
    )
    res.status(200).json({ msg: `Task request id ${taskRequestId} is now ${newState}` })

    try {
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
        await createTaskAssignments(taskRequests, taskId, allMembers)
      } else {
        await notifyAfterUpdatingState(
          taskRequestId,
          newState,
          allMembers.filter((member) => member.id !== req.account.id)
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

import { Request, Response, NextFunction, Router } from 'express'

import _ from 'lodash'

import taskModel from '../models/task'
import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import apartmentModel from '../models/apartment'
import accountModel, { Profile } from '../models/account'
import pusher, { makeChannel, pusherConstant } from '../pusherConfig'

import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

import { Prisma, TaskRequest } from '@prisma/client'

function validateTaskProperty(taskProperty: any): boolean {
  const { name, description, frequency, difficulty, start, end } = taskProperty
  if (typeof name !== 'string') return false
  if (typeof description !== 'string') return false
  if (typeof frequency !== 'number') return false
  if (typeof difficulty !== 'number') return false
  if (isNaN(Date.parse(start))) return false
  if (isNaN(Date.parse(end))) return false
  return true
}

export function taskPropertyValidator(req: Request, res: Response, next: NextFunction): void {
  if (!validateTaskProperty(req.body)) {
    const errorMessage = 'Invalid body'
    return processClientError(res, 400, errorMessage)
  }
  next()
}

function validateStringArray(arr: any): boolean {
  if (!Array.isArray(arr) || arr.length == 0) return false
  if (!arr.every((i) => typeof i === 'string')) return false
  return true
}

export async function assignersValidator(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const assignerUsernames: string[] = req.body.assigners

  if (!req.account.apartment) {
    const errorMessage = 'ConditionNotMeet error: you must be a member of an apartment'
    return processClientError(res, 400, errorMessage)
  }

  if (!validateStringArray(assignerUsernames)) {
    const errorMessage = 'Invalid body: "assigners" must be string array'
    return processClientError(res, 400, errorMessage)
  }

  try {
    const apartment = await apartmentModel.findJoinAdminNMembersApartment({
      id: req.account.apartment.id,
    })
    const members = apartment.members
    const memberUsernames = members.map((member) => member.username)

    const incompliantUsernames = assignerUsernames.filter(
      (username) => !memberUsernames.includes(username)
    )
    if (incompliantUsernames.length > 0) {
      const errorMessage =
        `NotFound error: user(s) ${incompliantUsernames.join()} ` +
        'are not member of this apartment'
      return processClientError(res, 400, errorMessage)
    }
    res.locals.members = members
    next()
  } catch (err) {
    next(err)
  }
}

export function orderValidator(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): void {
  const errorMessage = 'Invalid body: "order" must be string array'

  if (!validateStringArray(req.body.order)) return processClientError(res, 400, errorMessage)
  next()
}

function parseTaskProperty(
  taskProperty: any
): Omit<Prisma.TaskCreateInput, 'creator' | 'task_requests' | 'task_assignments'> {
  const { name, description, frequency, difficulty, start, end } = taskProperty

  return {
    name,
    description,
    frequency,
    difficulty,
    start: new Date(start),
    end: new Date(end),
  }
}

export async function creatorNAdminPermissionValidator(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const taskId = Number(req.params.id)
    const errorMessage = 'Forbidden error'
    const task = await taskModel.find({ id: taskId })

    if (!task || !req.account.apartment) {
      return processClientError(res, 403, errorMessage)
    }

    if (task.creator_id === req.account.id) {
      return next()
    }

    const apartment = await apartmentModel.find({
      id: req.account.apartment.id,
    })
    if (apartment && apartment.admin_id === req.account.id) {
      return next()
    }
    return processClientError(res, 403, errorMessage)
  } catch (err) {
    next(err)
  }
}

export async function membersPermissionValidator(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const taskId = Number(req.params.id)
    const errorMessage = 'Forbidden error'

    const task = await taskModel.findJoinCreatorApartment({ id: taskId })

    if (!task || !req.account.apartment || task.creator.apartment_id != req.account.apartment.id) {
      return processClientError(res, 403, errorMessage)
    }
    next()
  } catch (err) {
    next(err)
  }
}

async function createTaskRequests(assigners: Profile[], taskId: number): Promise<void> {
  const taskRequestCreateData = assigners.map((profile) => ({
    assigner_id: profile.id,
    task_id: taskId,
  }))
  await taskRequestModel.createMany(taskRequestCreateData)
}

async function create(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskProperty = parseTaskProperty(req.body)
  const assignerUsernames: string[] = req.body.assigners
  const members: Profile[] = res.locals.members

  try {
    const createdTask = await taskModel.create({
      ...taskProperty,
      creator_id: req.account.id,
    })
    const assigners = members.filter((member) => assignerUsernames.includes(member.username))
    await createTaskRequests(assigners, createdTask.id)

    res.status(201).json(createdTask)

    const notifiedUsers = assigners.filter((assigner) => assigner.id !== req.account.id)
    pusher.trigger(
      notifiedUsers.map((user) => makeChannel(user.id)),
      pusherConstant.TASK_EVENT,
      {
        state: pusherConstant.CREATED_STATE,
        task: taskProperty.name,
        creator: req.account.username,
      }
    )
  } catch (err) {
    next(err)
  }
}

async function update(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskId = Number(req.params.id)

  if (!validateTaskProperty(req.body)) {
    const errorMessage = 'Invalid body'
    return processClientError(res, 400, errorMessage)
  }
  const newTaskProperty = parseTaskProperty(req.body)

  try {
    const updatedTask = await taskModel.update({ id: taskId }, newTaskProperty)
    res.status(200).json(updatedTask)
  } catch (err) {
    next(err)
  }
}

async function deleteOne(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskId = Number(req.params.id)

  async function notifyAfterDeleting(taskRequests: TaskRequest[], deletedTaskName: string) {
    try {
      let notifiedChannels: string[] = []
      if (taskRequests.length > 0) {
        notifiedChannels = taskRequests.map((taskRequest) => makeChannel(taskRequest.assigner_id))
      } else {
        const allMembers = await accountModel.findMany({
          apartment_id: Number(req.account.apartment?.id),
        })
        notifiedChannels = allMembers.map((member) => makeChannel(member.id))
      }
      await pusher.trigger(notifiedChannels, pusherConstant.TASK_EVENT, {
        state: pusherConstant.DELETED_STATE,
        task: deletedTaskName,
        deleter: req.account.username,
      })
    } catch (error) {
      console.log(error)
    }
  }

  try {
    const taskRequests = await taskRequestModel.findMany({ task_id: taskId })

    const deletedTask = await taskModel.deleteOne({ id: taskId })
    res.status(204).json()
    await notifyAfterDeleting(taskRequests, deletedTask.name)
  } catch (err) {
    next(err)
  }
}

async function findResponseTask(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskId = Number(req.params.id)
  try {
    const responseTaskRequest = await taskRequestModel.findResponseTaskRequest({
      task_id: taskId,
    })
    if (responseTaskRequest) {
      res.status(200).json(responseTaskRequest)
      return
    }
    const responseTaskAssignment = await taskAssignmentModel.findResponseTaskAssignment({
      task_id: taskId,
    })
    res.status(200).json(responseTaskAssignment)
  } catch (err) {
    next(err)
  }
}

async function findResponseTasks(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apartment = req.account.apartment
  if (!apartment) {
    res.status(204).json()
    return
  }
  const accountId = req.account.id
  try {
    const taskRequests = await taskRequestModel.findJoinTaskRequests({
      assigner_id: accountId,
    })

    const taskAssignments = await taskAssignmentModel.findJoinTaskAssignments({
      assigner_id: accountId,
    })
    res.status(200).json({
      requests: taskRequests,
      assignments: taskAssignments,
    })
  } catch (err) {
    next(err)
  }
}

async function updateOrder(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskId = Number(req.params.id)
  const usernamesOrder: string[] = req.body.order
  try {
    const responseTaskAssignment = await taskAssignmentModel.findResponseTaskAssignment({
      task_id: taskId,
    })
    if (!responseTaskAssignment) {
      const errorMessage = 'ConditionNotMeet error: Task hasn\'t been assigned to anyones'
      return processClientError(res, 400, errorMessage)
    }
    const assignerUsernames = responseTaskAssignment.assignments.map(
      (assignment) => assignment.assigner.username
    )
    if (!_.isEqual(_.sortBy(usernamesOrder), _.sortBy(assignerUsernames))) {
      const errorMessage = 'Invalid body: Order must contain all member usernames'
      return processClientError(res, 400, errorMessage)
    }
    for (const [i, username] of usernamesOrder.entries()) {
      const assignmentId = responseTaskAssignment.assignments.find(
        (assignment) => assignment.assigner.username === username
      ).id
      await taskAssignmentModel.update({ id: assignmentId }, { order: i })
    }
    res.status(200).json({ order: usernamesOrder })
  } catch (err) {
    next(err)
  }
}

async function updateAssigners(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const assignerUsernames: string[] = req.body.assigners
  const taskId = Number(req.params.id)
  const members: Profile[] = res.locals.members

  try {
    await taskRequestModel.deleteMany({ task_id: taskId })
    await taskAssignmentModel.deleteMany({ task_id: taskId })

    const assigners = members.filter((member) => assignerUsernames.includes(member.username))
    await createTaskRequests(assigners, taskId)
    res.status(200).json({ assigners: assignerUsernames })
  } catch (err) {
    next(err)
  }
}

export default {
  findResponseTask,
  findResponseTasks,
  create,
  update,
  updateOrder,
  updateAssigners,
  deleteOne,
}

import { Request, Response, NextFunction, Router } from 'express'

import _ from 'lodash'

import taskModel from '../models/task'
import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import apartmentModel from '../models/apartment'
import accountModel, { JoinApartmentAccount } from '../models/account'

import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

import { Prisma } from '@prisma/client'

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

export function taskPropertyValidator(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  if (!validateTaskProperty(request.body)) {
    const errorMessage = 'Invalid body'
    return processClientError(response, 400, errorMessage)
  }
  next()
}

function validateStringArray(arr: any): boolean {
  if (!Array.isArray(arr) || arr.length == 0) return false
  if (!arr.every((i) => typeof i === 'string')) return false
  return true
}

export function assignersValidator(
  request: RequestAfterExtractor,
  response: Response,
  next: NextFunction
): void {
  const errorMessage = 'Invalid body: "assigners" must be string array'

  if (!validateStringArray(request.body.assigners))
    return processClientError(response, 400, errorMessage)
  next()
}

export function orderValidator(
  request: RequestAfterExtractor,
  response: Response,
  next: NextFunction
): void {
  const errorMessage = 'Invalid body: "order" must be string array'

  if (!validateStringArray(request.body.order))
    return processClientError(response, 400, errorMessage)
  next()
}

function parseTaskProperty(taskProperty: any): Omit<Prisma.TaskUncheckedCreateInput, 'creator_id'> {
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
  request: RequestAfterExtractor,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const taskId = Number(request.params.id)
    const errorMessage = 'Forbidden error'
    const task = await taskModel.find({ id: taskId })

    if (!task || !request.account.apartment) {
      return processClientError(response, 403, errorMessage)
    }

    if (task.creator_id === request.account.id) {
      return next()
    }

    const apartment = await apartmentModel.find({
      id: request.account.apartment.id,
    })
    if (apartment && apartment.admin_id === request.account.id) {
      return next()
    }
    return processClientError(response, 403, errorMessage)
  } catch (err) {
    next(err)
  }
}

export async function membersPermissionValidator(
  request: RequestAfterExtractor,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const taskId = Number(request.params.id)
    const errorMessage = 'Forbidden error'

    const task = await taskModel.findJoinCreatorApartment({ id: taskId })

    if (
      !task ||
      !request.account.apartment ||
      task.creator.apartment_id != request.account.apartment.id
    ) {
      return processClientError(response, 403, errorMessage)
    }
    next()
  } catch (err) {
    next(err)
  }
}

async function create(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const taskProperty = parseTaskProperty(req.body)

  const assignerUsernames: string[] = req.body.assigners

  if (!req.account.apartment) {
    const errorMessage = 'ConditionNotMeet error: you must be a member of an apartment'
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
        `NotFound error: usernames: ${incompliantUsernames.join()} ` +
        'are not member of this apartment'
      return processClientError(res, 400, errorMessage)
    }
    const createdTask = await taskModel.create({
      ...taskProperty,
      creator_id: req.account.id,
    })

    const assigners = members.filter((member) => assignerUsernames.includes(member.username))
    const taskRequestCreateData = assigners.map((profile) => ({
      assigner_id: profile.id,
      task_id: createdTask.id,
    }))
    await taskRequestModel.createMany(taskRequestCreateData)

    res.status(201).json(createdTask)
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

  try {
    await taskModel.deleteOne({ id: taskId })
    res.status(204).json()
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
  const usernames: string[] = req.body.order
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
    if (!_.isEqual(_.sortBy(usernames), _.sortBy(assignerUsernames))) {
      const errorMessage = 'Invalid body: Orders must contain all member usernames'
      return processClientError(res, 400, errorMessage)
    }
    for (const [i, username] of usernames.entries()) {
      const assignmentId = responseTaskAssignment.assignments.find(
        (assignment) => assignment.assigner.username === username
      ).id
      await taskAssignmentModel.update({ id: assignmentId }, { order: i })
    }
    res.status(200).json({ order: usernames })
  } catch (err) {
    next(err)
  }
}

async function updateAssigners(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usernames: string[] = req.body.assigners
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
  deleteOne,
}

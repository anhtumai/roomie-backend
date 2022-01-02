import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

import _ from 'lodash'

import taskModel, { updateTaskAssignees, updateTaskAssignmentOrders } from '../models/task'
import taskRequestModel, { JoinAssigneeRequest } from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import apartmentModel from '../models/apartment'
import { Profile } from '../models/account'

import taskPusher from '../pusher/task'

import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

import { Prisma } from '@prisma/client'

function validateTaskProperty(taskProperty: any): Joi.ValidationError | undefined {
  const schema = Joi.object({
    name: Joi.string().min(5).max(33).required(),
    description: Joi.string().required(),
    frequency: Joi.number().min(1).required(),
    difficulty: Joi.number().min(0).max(10).required(),
    start: Joi.date().required(),
    end: Joi.date().required(),
    assignees: Joi.array().items(Joi.string()).optional(),
  })
  const validationResult = schema.validate(taskProperty)
  return validationResult.error
}

export function taskPropertyValidator(req: Request, res: Response, next: NextFunction): void {
  const error = validateTaskProperty(req.body)
  if (error) {
    return processClientError(res, 400, error.message)
  }
  next()
}

function validateStringArray(arr: any): boolean {
  if (!Array.isArray(arr) || arr.length == 0) return false
  if (!arr.every((i) => typeof i === 'string')) return false
  return true
}

export async function assigneesValidator(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const assigneeUsernames: string[] = req.body.assignees

  if (!req.account.apartment) {
    const errorMessage = 'You must be a member of an apartment'
    return processClientError(res, 400, errorMessage)
  }

  if (!validateStringArray(assigneeUsernames)) {
    const errorMessage = 'Invalid body: "assignees" must be string array'
    return processClientError(res, 400, errorMessage)
  }

  try {
    const apartment = await apartmentModel.findJoinAdminNMembersApartment({
      id: req.account.apartment.id,
    })
    const members = apartment.members
    const memberUsernames = members.map((member) => member.username)

    const incompliantUsernames = assigneeUsernames.filter(
      (username) => !memberUsernames.includes(username)
    )
    if (incompliantUsernames.length > 0) {
      const errorMessage = `User(s) ${incompliantUsernames.join()} are not member of this apartment`
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

async function createTaskRequests(
  assignees: Profile[],
  taskId: number
): Promise<JoinAssigneeRequest[]> {
  const taskRequestCreateData = assignees.map((profile) => ({
    assignee_id: profile.id,
    task_id: taskId,
  }))
  await taskRequestModel.createMany(taskRequestCreateData)

  const taskRequests = await taskRequestModel.findJoinAssigneeRequests({ task_id: taskId })
  return taskRequests
}

async function create(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const members: Profile[] = res.locals.members

  const taskProperty = parseTaskProperty(req.body)
  const assigneeUsernames: string[] = req.body.assignees

  try {
    const assignees = members.filter((member) => assigneeUsernames.includes(member.username))

    // mutation
    const createdTask = await taskModel.create({
      ...taskProperty,
      creator_id: req.account.id,
    })
    const taskRequests = await createTaskRequests(assignees, createdTask.id)

    res.status(201).json({ task: createdTask, requests: taskRequests })

    // post-response
    await taskPusher.notifyAfterCreating(members, createdTask.name, req.account, assigneeUsernames)
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

  const newTaskProperty = parseTaskProperty(req.body)

  try {
    // mutation
    const updatedTask = await taskModel.update({ id: taskId }, newTaskProperty)
    res.status(200).json(updatedTask)

    // post-response
    await taskPusher.notifyAfterUpdating(updatedTask.name, req.account)
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
    // mutation
    const deletedTask = await taskModel.deleteOne({ id: taskId })
    res.status(204).json()

    // post-response
    await taskPusher.notifyAfterDeleting(deletedTask.name, req.account)
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

    // query
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
    // query
    const taskRequests = await taskRequestModel.findJoinTaskRequests({
      assignee_id: accountId,
    })

    const taskAssignments = await taskAssignmentModel.findJoinTaskAssignments({
      assignee_id: accountId,
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
    // query
    const responseTaskAssignment = await taskAssignmentModel.findResponseTaskAssignment({
      task_id: taskId,
    })
    if (!responseTaskAssignment) {
      const errorMessage = 'Task hasn\'t been assigned to anyones'
      return processClientError(res, 400, errorMessage)
    }
    const assigneeUsernames = responseTaskAssignment.assignments.map(
      (assignment) => assignment.assignee.username
    )
    if (!_.isEqual(_.sortBy(usernamesOrder), _.sortBy(assigneeUsernames))) {
      const errorMessage = 'Invalid body: Order must contain all member usernames'
      return processClientError(res, 400, errorMessage)
    }

    // mutation
    await updateTaskAssignmentOrders(usernamesOrder, responseTaskAssignment.assignments)

    const previousAssignments = responseTaskAssignment.assignments
    const updatedAssignments = previousAssignments.map((assignment) => {
      return { ...assignment, order: usernamesOrder.indexOf(assignment.assignee.username) }
    })
    res.status(200).json({
      ...responseTaskAssignment,
      assignments: _.sortBy(updatedAssignments, (assignment) => assignment.order),
    })

    // post-response
    await taskPusher.notifyAfterReorder(responseTaskAssignment.task.name, req.account)
  } catch (err) {
    next(err)
  }
}

async function updateAssignees(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const members: Profile[] = res.locals.members

  const assigneeUsernames: string[] = req.body.assignees
  const taskId = Number(req.params.id)

  try {
    // query
    const task = await taskModel.find({ id: taskId })

    const assignees = members.filter((member) => assigneeUsernames.includes(member.username))

    // mutation
    await updateTaskAssignees(taskId, assignees)

    // query
    const taskRequests = await taskRequestModel.findJoinAssigneeRequests({ task_id: taskId })

    res.status(200).json({ task: task, requests: taskRequests })

    // post-response
    await taskPusher.notifyAfterReAssigning(members, task.name, req.account)
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
  updateAssignees,
  deleteOne,
}

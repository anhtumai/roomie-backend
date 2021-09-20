import { Request, Response, NextFunction, Router } from 'express'

import _ from 'lodash'

import taskModel from '../models/task'
import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import apartmentModel from '../models/apartment'
import accountModel, { JoinApartmentAccount } from '../models/account'

import middleware from '../util/middleware'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

import { Prisma } from '@prisma/client'

const tasksRouter = Router()

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

function taskPropertyValidator(
    request: Request,
    response: Response,
    next: NextFunction,
): Response | void {
    if (!validateTaskProperty(request.body)) {
        return processClientError(response, 400, 'Task property is invalid')
    }
    next()
}

function validateStringArray(arr: any): boolean {
    if (!Array.isArray(arr) || arr.length == 0) return false
    if (!arr.every((i) => typeof i === 'string')) return false
    return true
}

function assignersValidator(
    request: RequestAfterExtractor,
    response: Response,
    next: NextFunction,
): Response | null {
    const errMessage = 'Assigners should contain list of assigners usernames'

    if (!validateStringArray(request.body.assigners))
        return processClientError(response, 400, errMessage)
    next()
}

function ordersValidator(
    request: RequestAfterExtractor,
    response: Response,
    next: NextFunction,
): Response | null {
    const errMessage = 'Orders should contain list of assigners usernames'

    if (!validateStringArray(request.body.orders))
        return processClientError(response, 400, errMessage)
    next()
}

function parseTaskProperty(
    taskProperty: any,
): Omit<Prisma.TaskUncheckedCreateInput, 'creator_id'> {
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

async function updateDeletePermissionValidator(
    request: RequestAfterExtractor,
    response: Response,
    next: NextFunction,
): Promise<Response | void> {
    try {
        const taskId = Number(request.params.id)
        const errorMessage =
      'Task doesn\'t exist or user is forbidden to edit/delete this task'
        const task = await taskModel.find({ id: taskId })
        if (task !== null && task.creator_id === request.account.id) {
            return next()
        }
        if (!request.account.apartment) {
            return processClientError(response, 403, errorMessage)
        }
        const apartment = await apartmentModel.find({
            id: request.account.apartment.id,
        })
        if (!apartment || apartment.admin_id !== request.account.id) {
            return processClientError(response, 403, errorMessage)
        }
        next()
    } catch (err) {
        next(err)
    }
}

async function viewPermissionValidator(
    request: RequestAfterExtractor,
    response: Response,
    next: NextFunction,
): Promise<Response | void> {
    try {
        const taskId = Number(request.params.id)
        const errorMessage =
      'Task doesn\'t exist or user is forbidden to view this task'

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

tasksRouter.post(
    '/',
    taskPropertyValidator,
    assignersValidator,
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const taskProperty = parseTaskProperty(req.body)

        const assignerUsernames: string[] = req.body.assigners

        if (!req.account.apartment) {
            return processClientError(
                res,
                400,
                'You can only create task if you are member of an apartment',
            )
        }
        try {
            const assigners: (JoinApartmentAccount | null)[] = await Promise.all(
                assignerUsernames.map(async (username) => {
                    const account = await accountModel.findJoinApartmentAccount({
                        username,
                    })
                    return account
                }),
            )
            const incompliantUsernames = _.zip(assignerUsernames, assigners)
                .filter((params) => {
                    const account = params[1]
                    if (!account) return true
                    if (!account.apartment) return true
                    if (account.apartment.id !== req.account.apartment.id) return true
                    return false
                })
                .map((params) => params[0])

            if (incompliantUsernames.length > 0) {
                return processClientError(
                    res,
                    400,
                    `These usernames: ${incompliantUsernames.join()} do not exist or are not member of this apartment`,
                )
            }
            const createdTask = await taskModel.create({
                ...taskProperty,
                creator_id: req.account.id,
            })

            const taskRequestCreateData = assigners.map((displayAccount) => ({
                assigner_id: displayAccount.id,
                task_id: createdTask.id,
            }))
            await taskRequestModel.createMany(taskRequestCreateData)

            return res.status(201).json(createdTask)
        } catch (err) {
            next(err)
        }
    },
)

tasksRouter.put(
    '/:id',
    taskPropertyValidator,
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    updateDeletePermissionValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)

        if (!validateTaskProperty(req.body)) {
            return processClientError(res, 400, 'Task property is invalid')
        }
        const newTaskProperty = parseTaskProperty(req.body)

        try {
            const updatedTask = await taskModel.update(
                { id: taskId },
                newTaskProperty,
            )
            return res.status(200).json(updatedTask)
        } catch (err) {
            next(err)
        }
    },
)

tasksRouter.delete(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    updateDeletePermissionValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)

        try {
            await taskRequestModel.deleteMany({ task_id: taskId })
            await taskAssignmentModel.deleteMany({ task_id: taskId })
            await taskModel.deleteOne({ id: taskId })

            return res.status(204).json()
        } catch (err) {
            next(err)
        }
    },
)

tasksRouter.get(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    viewPermissionValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)
        try {
            const responseTaskRequest =
        await taskRequestModel.findResponseTaskRequest({
            task_id: taskId,
        })
            if (responseTaskRequest) return res.status(200).json(responseTaskRequest)
            const responseTaskAssignment =
        await taskAssignmentModel.findResponseTaskAssignment({
            task_id: taskId,
        })
            return res.status(200).json(responseTaskAssignment)
        } catch (err) {
            next(err)
        }
    },
)

tasksRouter.put(
    '/:id/orders',
    ordersValidator,
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    updateDeletePermissionValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)
        const usernames: string[] = req.body.orders
        try {
            const responseTaskAssignment =
        await taskAssignmentModel.findResponseTaskAssignment({
            task_id: taskId,
        })
            if (!responseTaskAssignment)
                return processClientError(
                    res,
                    400,
                    'Task hasn\'t been assigned to anyones',
                )
            const assignerUsernames = responseTaskAssignment.assignments.map(
                (assignment) => assignment.assigner.username,
            )
            if (!_.isEqual(usernames.sort(), assignerUsernames.sort()))
                return processClientError(
                    res,
                    400,
                    'Orders must contain all member usernames',
                )
            for (const [i, username] of usernames.entries()) {
                const assignmentId = responseTaskAssignment.assignments.find(
                    (assignment) => assignment.assigner.username === username,
                ).id
                await taskAssignmentModel.update({ id: assignmentId }, { order: i })
            }
            return res.status(204).json()
        } catch (err) {
            next(err)
        }
    },
)

export default tasksRouter

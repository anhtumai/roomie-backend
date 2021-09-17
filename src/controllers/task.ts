import { Router } from 'express'

import _ from 'lodash'

import taskModel from '../models/task'

import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'
import accountModel, { DisplayAccount } from '../models/account'
import taskRequestModel from '../models/taskRequest'

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

tasksRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        if (!validateTaskProperty(req.body)) {
            return processClientError(res, 400, 'Task property is invalid')
        }
        const taskProperty = parseTaskProperty(req.body)

        const assignerUsernames: string[] = req.body.assigners

        if (!Array.isArray(assignerUsernames) || assignerUsernames.length == 0) {
            return processClientError(res, 400, 'List of assigners is missing')
        }

        if (!assignerUsernames.every((i) => typeof i === 'string')) {
            return processClientError(res, 400, 'List of assigners is invalid')
        }

        const assigners: (DisplayAccount | null)[] = await Promise.all(
            assignerUsernames.map(async (username) => {
                const displayAccount = await accountModel.findDisplayAccount({
                    username,
                })
                return displayAccount
            }),
        )
        const incompliantUsernames = _.zip(assignerUsernames, assigners)
            .filter((params) => {
                const displayAccount = params[1]
                if (!displayAccount) return true
                if (!displayAccount.apartment) return true
                if (displayAccount.apartment.id !== req.account.apartment.id)
                    return true
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

        try {
            if (!req.account.apartment) {
                return processClientError(
                    res,
                    400,
                    'You can only create task if you are member of an apartment',
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
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)

        const updateParams = req.body

        try {
            const taskToUpdate = await taskModel.find({ id: taskId })
            if (taskToUpdate === null || taskToUpdate.creator_id !== req.account.id) {
                return processClientError(
                    res,
                    403,
                    'This task does not exist or user is forbidden to edit this task',
                )
            }
            const updatedTask = await taskModel.update({ id: taskId }, updateParams)
            return res.json(200).json(updatedTask)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

tasksRouter.delete(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)

        try {
            const deletedTask = await taskModel.find({ id: taskId })
            if (deletedTask === null || deletedTask.creator_id !== req.account.id) {
                return processClientError(
                    res,
                    403,
                    'This task does not exist or user is forbidden to delete this task',
                )
            }
            await taskModel.deleteOne({ id: taskId })
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

export default tasksRouter

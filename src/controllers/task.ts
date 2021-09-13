import { Router } from 'express'

import taskModel, { TaskProperty } from '../models/task'
import membershipModel from '../models/membership'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'
import { isNaN } from 'lodash'

const taskRouter = Router()

function validateTaskProperty(taskProperty: TaskProperty): boolean {
    const { name, description, frequency, difficulty, start, end } = taskProperty

    if (typeof name !== 'string') return false
    if (typeof description !== 'string') return false
    if (typeof frequency !== 'number') return false
    if (typeof difficulty !== 'number') return false
    if (isNaN(Date.parse(start))) return false
    if (isNaN(Date.parse(end))) return false
    return true
}

taskRouter.get(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        return
    },
)

taskRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const taskProperty: TaskProperty = req.body
        if (!validateTaskProperty(taskProperty)) {
            return processClientError(res, 400, 'Task property is invalid')
        }

        try {
            const apartment = await membershipModel.findApartment(req.account.id)

            if (apartment === null) {
                return processClientError(
                    res,
                    400,
                    'You can only create task if you are member of an apartment',
                )
            }

            const updatedTask = await taskModel.create(taskProperty, req.account.id)
            return res.json(201).json(updatedTask)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

taskRouter.put(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)

        const updateParams = req.body

        try {
            const taskToUpdate = await taskModel.find({ id: taskId })
            if (taskToUpdate === null || taskToUpdate.creatorId !== req.account.id) {
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

taskRouter.delete(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    async (req: RequestAfterExtractor, res, next) => {
        const taskId = Number(req.params.id)

        try {
            const deletedTask = await taskModel.find({ id: taskId })
            if (deletedTask === null || deletedTask.creatorId !== req.account.id) {
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

import { Router } from 'express'

import taskModel, { TaskProperty } from '../models/task'
import middleware from '../util/middleware'
import logger from '../util/logger'
import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

const taskRouter = Router()

taskRouter.post(
    '/',
    middleware.accountExtractor,
    async (req: RequestAfterExtractor, res, next) => {
        const taskProperty: TaskProperty = req.body
        if (
            !taskProperty.name ||
      !taskProperty.description ||
      !taskProperty.frequency ||
      !taskProperty.difficulty ||
      !taskProperty.start ||
      !taskProperty.end
        ) {
            return processClientError(res, 400, 'Task property is missing')
        }
        try {
            const updatedTask = await taskModel.create(taskProperty)
            return res.json(201).json(updatedTask)
        } catch (err) {
            logger.error(err)
            next(err)
        }
    },
)

import { Router } from 'express'

import taskRequestController from '../controllers/taskRequest'

import middleware from '../util/middleware'

const taskRequestsRouter = Router()

taskRequestsRouter.patch(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  taskRequestController.updateState,
)
export default taskRequestsRouter

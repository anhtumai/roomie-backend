import { Router } from 'express'

import _ from 'lodash'

import taskController, {
  taskPropertyValidator,
  assignersValidator,
  orderValidator,
  creatorNAdminPermissionValidator,
  membersPermissionValidator,
} from '../controllers/task'

import middleware from '../util/middleware'

const tasksRouter = Router()

tasksRouter.post(
  '/',
  taskPropertyValidator,
  assignersValidator,
  middleware.accountExtractor,
  taskController.create,
)

tasksRouter.put(
  '/:id',
  taskPropertyValidator,
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  creatorNAdminPermissionValidator,
  taskController.update,
)

tasksRouter.delete(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  creatorNAdminPermissionValidator,
  taskController.deleteOne,
)

tasksRouter.get(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  membersPermissionValidator,
  taskController.findResponseTask,
)

tasksRouter.put(
  '/:id/order',
  orderValidator,
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  creatorNAdminPermissionValidator,
  taskController.updateOrder,
)

export default tasksRouter

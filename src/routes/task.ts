import { Router } from 'express'

import _ from 'lodash'

import taskController, {
  taskPropertyValidator,
  assigneesValidator,
  orderValidator,
  creatorNAdminPermissionValidator,
  membersPermissionValidator,
} from '../controllers/task'

import middleware from '../util/middleware'

const tasksRouter = Router()

tasksRouter.post(
  '/',
  taskPropertyValidator,
  middleware.accountExtractor,
  assigneesValidator,
  taskController.create
)

tasksRouter.put(
  '/:id',
  middleware.paramsIdValidator,
  taskPropertyValidator,
  middleware.accountExtractor,
  creatorNAdminPermissionValidator,
  taskController.update
)

tasksRouter.delete(
  '/:id',
  middleware.paramsIdValidator,
  middleware.accountExtractor,
  creatorNAdminPermissionValidator,
  taskController.deleteOne
)

tasksRouter.get(
  '/:id',
  middleware.paramsIdValidator,
  middleware.accountExtractor,
  membersPermissionValidator,
  taskController.findResponseTask
)

tasksRouter.put(
  '/:id/order',
  middleware.paramsIdValidator,
  orderValidator,
  middleware.accountExtractor,
  creatorNAdminPermissionValidator,
  taskController.updateOrder
)

tasksRouter.put(
  '/:id/assignees',
  middleware.paramsIdValidator,
  middleware.accountExtractor,
  creatorNAdminPermissionValidator,
  assigneesValidator,
  taskController.updateAssignees
)

export default tasksRouter

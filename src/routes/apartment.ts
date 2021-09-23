import { Router } from 'express'

import apartmentController, { adminPermissionValidator } from '../controllers/apartment'

import middleware from '../util/middleware'

const apartmentsRouter = Router()

apartmentsRouter.post('/', middleware.accountExtractor, apartmentController.create)

apartmentsRouter.put(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  adminPermissionValidator,
  apartmentController.update
)

apartmentsRouter.delete(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  adminPermissionValidator,
  apartmentController.deleteOne
)

export default apartmentsRouter

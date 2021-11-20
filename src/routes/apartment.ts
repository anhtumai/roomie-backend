import { Router } from 'express'

import apartmentController, {
  adminPermissionValidatorForApartmentsId,
} from '../controllers/apartment'

import middleware from '../util/middleware'

const apartmentsRouter = Router()

apartmentsRouter.post('/', middleware.accountExtractor, apartmentController.create)

apartmentsRouter.put(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  adminPermissionValidatorForApartmentsId,
  apartmentController.update
)

apartmentsRouter.delete(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  adminPermissionValidatorForApartmentsId,
  apartmentController.deleteOne
)

export default apartmentsRouter

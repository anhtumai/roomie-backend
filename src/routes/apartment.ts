import { Router } from 'express'

import apartmentController from '../controllers/apartment'

import middleware from '../util/middleware'

const apartmentsRouter = Router()

apartmentsRouter.post('/', middleware.accountExtractor, apartmentController.create)

apartmentsRouter.delete(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    apartmentController.deleteOne,
)

export default apartmentsRouter

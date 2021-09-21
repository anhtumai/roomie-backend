import { Router } from 'express'

import invitationsController from '../controllers/invitation'

import middleware from '../util/middleware'

const invitationsRouter = Router()

invitationsRouter.post('/', middleware.accountExtractor, invitationsController.create)

invitationsRouter.post(
    '/:id/reject',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    invitationsController.reject,
)

invitationsRouter.post(
    '/:id/accept',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    invitationsController.accept,
)

invitationsRouter.delete(
    '/:id',
    middleware.accountExtractor,
    middleware.paramsIdValidator,
    invitationsController.deleteOne,
)

export default invitationsRouter

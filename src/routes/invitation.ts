import { Router } from 'express'

import invitationController from '../controllers/invitation'

import middleware from '../util/middleware'

const invitationRouter = Router()

invitationRouter.post('/', middleware.accountExtractor, invitationController.create)

invitationRouter.post(
  '/:id/reject',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  invitationController.reject,
)

invitationRouter.post(
  '/:id/accept',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  invitationController.accept,
)

invitationRouter.delete(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  invitationController.deleteOne,
)

export default invitationRouter

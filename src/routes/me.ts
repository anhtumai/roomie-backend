import { Router } from 'express'

import accountController from '../controllers/account'
import apartmentController, {
  adminPermissionValidatorForMeApartment,
} from '../controllers/apartment'
import invitationController from '../controllers/invitation'
import taskController from '../controllers/task'

import middleware from '../util/middleware'

const meRouter = Router()

meRouter.get('/', middleware.accountExtractor, accountController.findJoinApartmentAccount)

meRouter.get('/apartment', middleware.accountExtractor, apartmentController.findJoinTasksApartment)

meRouter.delete(
  '/apartment/members/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  adminPermissionValidatorForMeApartment,
  apartmentController.removeMember
)

meRouter.delete('/apartment', middleware.accountExtractor, apartmentController.leave)

meRouter.get('/tasks', middleware.accountExtractor, taskController.findResponseTasks)

meRouter.get('/invitations', middleware.accountExtractor, invitationController.findMany)

export default meRouter

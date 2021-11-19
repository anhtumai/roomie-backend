import { Router } from 'express'

import accountController from '../controllers/account'
import middleware from '../util/middleware'

const accountRouter = Router()

accountRouter.post('/', accountController.create)
accountRouter.put(
  '/:id',
  middleware.accountExtractor,
  middleware.paramsIdValidator,
  accountController.update
)
export default accountRouter

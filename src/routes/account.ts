import { Router } from 'express'

import accountController from '../controllers/account'

const accountRouter = Router()

accountRouter.post('/', accountController.create)

export default accountRouter

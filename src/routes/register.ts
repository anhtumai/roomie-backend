import { Router } from 'express'

import accountController from '../controllers/account'

const registerRouter = Router()

registerRouter.post('/', accountController.create)

export default registerRouter

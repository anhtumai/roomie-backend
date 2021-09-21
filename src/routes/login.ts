import { Router } from 'express'

import accountController from '../controllers/account'

const loginRouter = Router()

loginRouter.post('/', accountController.login)

export default loginRouter

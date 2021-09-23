import { Router } from 'express'

import accountController from '../controllers/account'

const authRouter = Router()

authRouter.post('/login', accountController.login)

export default authRouter

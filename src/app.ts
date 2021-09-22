import express from 'express'

import swaggerUI from 'swagger-ui-express'

import meRouter from './routes/me'
import authRouter from './routes/auth'
import accountRouter from './routes/account'
import apartmentsRouter from './routes/apartment'
import invitationsRouter from './routes/invitation'
import tasksRouter from './routes/task'
import taskRequestRouter from './routes/taskRequest'

import middleware from './util/middleware'
import specs from './swaggerSpecs'

const app = express()

app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)

app.use('/api/me', meRouter)
app.use('/api/apartments', apartmentsRouter)
app.use('/api/auth', authRouter)
app.use('/api/accounts', accountRouter)
app.use('/api/invitations', invitationsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/taskrequests', taskRequestRouter)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs))

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export default app

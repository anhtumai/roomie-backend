import express from 'express'

import meRouter from './controllers/me'
import loginRouter from './controllers/login'
import registerRouter from './controllers/register'
import apartmentsRouter from './controllers/apartment'
import invitationsRouter from './controllers/invitation'
import tasksRouter from './controllers/task'

import middleware from './util/middleware'

const app = express()

app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)

app.use('/api/me', meRouter)
app.use('/api/apartments', apartmentsRouter)
app.use('/api/login', loginRouter)
app.use('/api/register', registerRouter)
app.use('/api/invitations', invitationsRouter)
app.use('/api/tasks', tasksRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export default app

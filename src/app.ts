import express from 'express'

import loginRouter from './controllers/login'
import registerRouter from './controllers/register'
import apartmentRouter from './controllers/apartment'
import invitationRouter from './controllers/invitation'
import testingRouter from './controllers/testing'

import middleware from './util/middleware'

const app = express()

app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)

app.use('/api/apartment', apartmentRouter)
app.use('/api/login', loginRouter)
app.use('/api/register', registerRouter)
app.use('/api/invitation', invitationRouter)
app.use('/api/testing', testingRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export default app

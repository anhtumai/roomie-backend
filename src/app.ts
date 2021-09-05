import express from 'express'

import loginRouter from './controllers/login'
import registerRouter from './controllers/register'

import middleware from './util/middleware'

const app = express()

app.use(express.json())
app.use(middleware.tokenExtractor)

app.use('/api/login', loginRouter)
app.use('/api/register', registerRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export default app

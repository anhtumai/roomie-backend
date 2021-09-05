import http from 'http'
import app from './app'

import logger from './util/logger'

const server = http.createServer(app)

server.listen(3003, () => {
    logger.info('Server running on 3003')
})

import Pusher from 'pusher'

import dotenv from 'dotenv'

dotenv.config()

const pusher = new Pusher({
  appId: String(process.env.PUSHER_APP_ID),
  key: String(process.env.PUSHER_KEY),
  secret: String(process.env.PUSHER_SECRET),
  cluster: 'eu',
  useTLS: true,
})

export default pusher

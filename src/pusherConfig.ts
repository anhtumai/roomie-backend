import Pusher from 'pusher'

import dotenv from 'dotenv'
import apartment from './models/apartment'

dotenv.config()

const pusher = new Pusher({
  appId: String(process.env.PUSHER_APP_ID),
  key: String(process.env.PUSHER_KEY),
  secret: String(process.env.PUSHER_SECRET),
  cluster: 'eu',
  useTLS: true,
})

export function makeChannel(userId: number): string {
  return `notification-channel-${userId}`
}

export const pusherConstant = {
  APARTMENT_EVENT: 'apartment',
  INVITATION_EVENT: 'event',
  TASK_EVENT: 'task',

  CREATE_STATE: 'CREATE',
}

export default pusher

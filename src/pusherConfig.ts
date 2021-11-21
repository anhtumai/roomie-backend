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
  INVITATION_EVENT: 'invitation',
  TASK_EVENT: 'task',

  CREATED_STATE: 'CREATED',
  CANCELED_STATE: 'CANCELED',
  REJECTED_STATE: 'REJECTED',
  ACCEPTED_STATE: 'ACCEPTED',
  LEAVE_STATE: 'LEFT',
  ASSIGNED_STATE: 'ASSIGNED',
  DELETED_STATE: 'DELETED',
  EDITED_STATE: 'EDITED',
  REASSIGNED_STATE: 'REASSIGNED',
  REORDERED_STATE: 'REORDERED',
  MEMBER_REMOVED_STATE: 'MEMBER_REMOVED',
}

export default pusher

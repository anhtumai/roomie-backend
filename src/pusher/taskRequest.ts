import { Profile } from '../models/account'

import pusher, { makeChannel, pusherConstant } from './config'

async function notifyAfterUpdatingState(
  members: Profile[],
  taskRequestId: number,
  updatedState: 'pending' | 'accepted' | 'rejected',
  updater: {
    id: number
  }
): Promise<void> {
  const notifiedChannels = members
    .filter((member) => member.id !== updater.id)
    .map((member) => makeChannel(member.id))

  await pusher.trigger(notifiedChannels, pusherConstant.TASK_REQUEST_EVENT, {
    id: taskRequestId,
    state: updatedState,
  })
}

async function notifyAfterChangingToTaskAssignment(
  members: Profile[],
  taskName: string,
  assigneeUsernames: string[]
): Promise<void> {
  const notifiedChannels = members.map((member) => makeChannel(member.id))

  await pusher.trigger(notifiedChannels, pusherConstant.TASK_EVENT, {
    state: pusherConstant.ASSIGNED_STATE,
    task: taskName,
    assignees: assigneeUsernames,
  })
}

export default {
  notifyAfterUpdatingState,
  notifyAfterChangingToTaskAssignment,
}

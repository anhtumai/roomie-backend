import { Profile } from '../models/account'

import pusher, { makeChannel, pusherConstant } from './config'

async function notifyAfterUpdatingState(
  taskRequestId: number,
  updatedState: 'pending' | 'accepted' | 'rejected',
  notifiedMembers: Profile[]
): Promise<void> {
  await pusher.trigger(
    notifiedMembers.map(({ id }) => makeChannel(id)),
    pusherConstant.TASK_REQUEST_EVENT,
    {
      id: taskRequestId,
      state: updatedState,
    }
  )
}

async function notifyAfterChangingToTaskAssignment(
  members: Profile[],
  taskName: string,
  assigneeUsernames: string[]
): Promise<void> {
  await pusher.trigger(
    members.map(({ id }) => makeChannel(id)),
    pusherConstant.TASK_EVENT,
    {
      state: pusherConstant.ASSIGNED_STATE,
      task: taskName,
      assignees: assigneeUsernames,
    }
  )
}

export default {
  notifyAfterUpdatingState,
  notifyAfterChangingToTaskAssignment,
}

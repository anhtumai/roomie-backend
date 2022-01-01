import accountModel, { JoinApartmentAccount, Profile } from '../models/account'
import pusher, { makeChannel, pusherConstant } from './config'
import logger from '../util/logger'

async function notifyAfterCreating(
  members: Profile[],
  taskName: string,
  creator: {
    id: number
    username: string
  },
  assigneeUsernames: string[]
): Promise<void> {
  try {
    const notifiedUsers = members.filter((assignee) => assignee.id !== creator.id)
    await pusher.trigger(
      notifiedUsers.map((user) => makeChannel(user.id)),
      pusherConstant.TASK_EVENT,
      {
        state: pusherConstant.CREATED_STATE,
        task: taskName,
        creator: creator.username,
        assignees: assigneeUsernames,
      }
    )
  } catch (err) {
    logger.error(err)
  }
}

async function notifyAfterUpdating(
  updatedTaskName: string,
  updater: JoinApartmentAccount
): Promise<void> {
  try {
    const allMembers = await accountModel.findMany({
      apartment_id: Number(updater.apartment?.id),
    })
    const notifiedChannels = allMembers
      .filter((member) => member.id !== updater.id)
      .map((member) => makeChannel(member.id))
    await pusher.trigger(notifiedChannels, pusherConstant.TASK_EVENT, {
      state: pusherConstant.EDITED_STATE,
      task: updatedTaskName,
      updater: updater.username,
    })
  } catch (err) {
    logger.error(err)
  }
}

async function notifyAfterDeleting(
  deletedTaskName: string,
  deleter: JoinApartmentAccount
): Promise<void> {
  try {
    const allMembers = await accountModel.findMany({
      apartment_id: Number(deleter.apartment?.id),
    })
    const notifiedChannels = allMembers
      .filter((member) => member.id !== deleter.id)
      .map((member) => makeChannel(member.id))
    await pusher.trigger(notifiedChannels, pusherConstant.TASK_EVENT, {
      state: pusherConstant.DELETED_STATE,
      task: deletedTaskName,
      deleter: deleter.username,
    })
  } catch (err) {
    logger.error(err)
  }
}

async function notifyAfterReorder(
  reorderTaskName: string,
  updater: JoinApartmentAccount
): Promise<void> {
  try {
    const allMembers = await accountModel.findMany({
      apartment_id: Number(updater.apartment?.id),
    })
    const notifiedChannels = allMembers
      .filter((member) => member.id !== updater.id)
      .map((member) => makeChannel(member.id))
    await pusher.trigger(notifiedChannels, pusherConstant.TASK_EVENT, {
      state: pusherConstant.REORDERED_STATE,
      task: reorderTaskName,
      assigner: updater.username,
    })
  } catch (err) {
    logger.error(err)
  }
}

async function notifyAfterReAssigning(
  members: Profile[],
  reAssignedTaskName: string,
  updater: JoinApartmentAccount
): Promise<void> {
  try {
    const notifiedChannels = members
      .filter((member) => member.id !== updater.id)
      .map((member) => makeChannel(member.id))
    await pusher.trigger(notifiedChannels, pusherConstant.TASK_EVENT, {
      state: pusherConstant.REASSIGNED_STATE,
      task: reAssignedTaskName,
      assigner: updater.username,
    })
  } catch (err) {
    logger.error(err)
  }
}

export default {
  notifyAfterCreating,
  notifyAfterUpdating,
  notifyAfterDeleting,
  notifyAfterReAssigning,
  notifyAfterReorder,
}

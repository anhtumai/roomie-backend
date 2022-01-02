import pusher, { makeChannel, pusherConstant } from './config'
import logger from '../util/logger'

export async function notifyAfterLeaving(
  memberIds: number[],
  leaver: {
    id: number
    username: string
  },
  currentAdminUsername: string
): Promise<void> {
  try {
    const notifiedChannels = memberIds
      .filter((memberId) => memberId !== leaver.id)
      .map((memberId) => makeChannel(memberId))
    await pusher.trigger(notifiedChannels, pusherConstant.APARTMENT_EVENT, {
      state: pusherConstant.LEAVE_STATE,
      leaver: leaver.username,
      admin: currentAdminUsername,
    })
  } catch (err) {
    logger.error(err)
  }
}

export async function notifyAfterRemovingMember(
  memberIds: number[],
  removedMemberUsername: string,
  remover: {
    id: number
  }
): Promise<void> {
  try {
    const notifiedChannels = memberIds
      .filter((memberId) => memberId !== remover.id)
      .map((memberId) => makeChannel(memberId))
    await pusher.trigger(notifiedChannels, pusherConstant.APARTMENT_EVENT, {
      state: pusherConstant.MEMBER_REMOVED_STATE,
      removedMember: removedMemberUsername,
    })
  } catch (err) {
    logger.error(err)
  }
}

export async function notifyAfterUpdating(
  memberIds: number[],
  apartmentName: string,
  updater: {
    id: number
  }
): Promise<void> {
  try {
    const notifiedChannels = memberIds
      .filter((memberId) => memberId !== updater.id)
      .map((memberId) => makeChannel(memberId))
    await pusher.trigger(notifiedChannels, pusherConstant.APARTMENT_EVENT, {
      state: pusherConstant.EDITED_STATE,
      apartmentName: apartmentName,
    })
  } catch (err) {
    logger.error(err)
  }
}

export default {
  notifyAfterLeaving,
  notifyAfterRemovingMember,
  notifyAfterUpdating,
}

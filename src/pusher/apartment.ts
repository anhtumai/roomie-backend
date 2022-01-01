import pusher, { makeChannel, pusherConstant } from './config'
import logger from '../util/logger'

export async function notifyAfterLeaving(
  memberIds: number[],
  leaverUsername: string,
  currentAdminUsername: string
): Promise<void> {
  try {
    await pusher.trigger(
      memberIds.map((memberId) => makeChannel(memberId)),
      pusherConstant.APARTMENT_EVENT,
      {
        state: pusherConstant.LEAVE_STATE,
        leaver: leaverUsername,
        admin: currentAdminUsername,
      }
    )
  } catch (err) {
    logger.error(err)
  }
}

export async function notifyAfterRemovingMember(
  memberIds: number[],
  removedMemberUsername: string
): Promise<void> {
  try {
    await pusher.trigger(
      memberIds.map((memberId) => makeChannel(memberId)),
      pusherConstant.APARTMENT_EVENT,
      {
        state: pusherConstant.MEMBER_REMOVED_STATE,
        removedMember: removedMemberUsername,
      }
    )
  } catch (err) {
    logger.error(err)
  }
}

export async function notifyAfterUpdating(
  memberIds: number[],
  apartmentName: string
): Promise<void> {
  try {
    await pusher.trigger(
      memberIds.map((memberId) => makeChannel(memberId)),
      pusherConstant.APARTMENT_EVENT,
      {
        state: pusherConstant.EDITED_STATE,
        apartmentName: apartmentName,
      }
    )
  } catch (err) {
    logger.error(err)
  }
}

export default {
  notifyAfterLeaving,
  notifyAfterRemovingMember,
  notifyAfterUpdating,
}

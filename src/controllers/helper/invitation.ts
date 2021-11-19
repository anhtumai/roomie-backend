import { PendingInvitation } from '../../models/invitation'
import accountModel from '../../models/account'

import pusher, { makeChannel, pusherConstant } from '../../pusherConfig'

async function notifyAfterCreating(
  invitorUsername: string,
  invitee: { id: number; username: string },
  apartmentName: string
): Promise<void> {
  try {
    await pusher.trigger(makeChannel(invitee.id), pusherConstant.INVITATION_EVENT, {
      state: pusherConstant.CREATED_STATE,
      invitor: invitorUsername,
      invitee: invitee.username,
      apartment: apartmentName,
    })
  } catch (err) {
    console.log(err)
  }
}

async function notifyAfterAccepting(
  apartment: { id: number; name: string },
  invitorUsername: string,
  inviteeUsername: string,
  toRejectInvitations: PendingInvitation[]
): Promise<void> {
  try {
    const members = await accountModel.findMany({ apartment_id: apartment.id })
    console.log(members)
    await pusher.trigger(
      members.map((member) => makeChannel(member.id)),
      pusherConstant.INVITATION_EVENT,
      {
        state: pusherConstant.ACCEPTED_STATE,
        invitor: invitorUsername,
        invitee: inviteeUsername,
        apartment: apartment.name,
      }
    )
    for (const invitation of toRejectInvitations) {
      await pusher.trigger(makeChannel(invitation.invitor.id), pusherConstant.INVITATION_EVENT, {
        state: pusherConstant.REJECTED_STATE,
        invitor: invitation.invitor.username,
        invitee: invitorUsername,
        apartment: invitation.apartment.name,
      })
    }
  } catch (err) {
    console.log(err)
  }
}

async function notifyAfterRejecting(
  invitation: PendingInvitation,
  inviteeUsername: string
): Promise<void> {
  try {
    await pusher.trigger(makeChannel(invitation.invitor.id), pusherConstant.INVITATION_EVENT, {
      state: pusherConstant.REJECTED_STATE,
      invitor: invitation.invitor.username,
      invitee: inviteeUsername,
      apartment: invitation.apartment.name,
    })
  } catch (err) {
    console.log(err)
  }
}

async function notifyAfterCancelling(
  invitation: PendingInvitation,
  invitorUsername: string,
  apartmentName: string
): Promise<void> {
  try {
    await pusher.trigger(makeChannel(invitation.invitee.id), 'invitation', {
      state: pusherConstant.CANCELED_STATE,
      invitor: invitorUsername,
      invitee: invitation.invitee.username,
      apartment: apartmentName,
    })
  } catch (err) {
    console.log(err)
  }
}

export const invitationHelper = {
  notifyAfterCreating,
  notifyAfterAccepting,
  notifyAfterRejecting,
  notifyAfterCancelling,
}

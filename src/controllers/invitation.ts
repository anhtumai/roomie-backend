import { Response, NextFunction, Router } from 'express'

import accountModel from '../models/account'
import invitationModel from '../models/invitation'

import processClientError from '../util/error'

import { RequestAfterExtractor } from '../types/express-middleware'

import pusher from '../pusherConfig'

async function findMany(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sentInvitations = await invitationModel.findMany({
      invitor_id: req.account.id,
    })
    const receivedInvitations = await invitationModel.findMany({
      invitee_id: req.account.id,
    })
    res.status(200).json({
      sent: sentInvitations,
      received: receivedInvitations,
    })
  } catch (err) {
    next(err)
  }
}

async function create(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const inviteeUsername = req.body.username

  if (!req.body.username) {
    const errorMessage = 'Invalid body: Invitee username is missing'
    return processClientError(res, 400, errorMessage)
  }

  if (inviteeUsername === req.account.username) {
    const errorMessage = 'Invalid body: You cannot invite yourself'
    return processClientError(res, 400, errorMessage)
  }
  if (!req.account.apartment) {
    const errorMessage = 'ConditionNotMeet error: You are not the member of any apartments'
    return processClientError(res, 404, errorMessage)
  }
  try {
    const invitee = await accountModel.findJoinApartmentAccount({
      username: inviteeUsername,
    })
    if (invitee === null) {
      const errorMessage = `ConditionNotMeet error: ${inviteeUsername} does not exist`
      return processClientError(res, 404, errorMessage)
    }

    if (invitee.apartment !== null) {
      const errorMessage =
        `ConditionNotMeet error: ${inviteeUsername} ` + 'is currently member of an apartment'
      return processClientError(res, 400, errorMessage)
    }
    const newInvitation = await invitationModel.create(
      req.account.id,
      invitee.id,
      req.account.apartment.id
    )
    res.status(201).json(newInvitation)
    await pusher.trigger(`notification-channel-${invitee.id}`, 'invitation', {
      state: 'CREATED',
      invitor: req.account.username,
      invitee: invitee.username,
      apartment: req.account.apartment.name,
    })
  } catch (err) {
    if (err.code === 'P2002') {
      const errorMessage = 'Conflict error: You had sent an invitation to this person'
      return processClientError(res, 400, errorMessage)
    }
    next(err)
  }
}

async function reject(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const invitationId = Number(req.params.id)

  try {
    const invitation = await invitationModel.find({
      id: invitationId,
    })
    if (invitation === null || invitation.invitee.id !== req.account.id) {
      const errorMessage = 'Forbidden error'
      return processClientError(res, 403, errorMessage)
    }
    await invitationModel.deleteOne({ id: invitationId })
    res.status(200).json({
      msg:
        `Reject invitation to ${invitation.apartment.name} ` +
        `from ${invitation.invitor.username}`,
    })
    await pusher.trigger(`notification-channel-${invitation.invitor.id}`, 'invitation', {
      state: 'REJECTED',
      invitor: invitation.invitor.username,
      invitee: req.account.username,
      apartment: invitation.apartment.name,
    })
  } catch (err) {
    next(err)
  }
}

async function accept(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const invitationId = Number(req.params.id)

  try {
    const invitation = await invitationModel.find({
      id: invitationId,
    })
    if (invitation === null || invitation.invitee.id !== req.account.id) {
      const errorMessage = 'Forbidden error'
      return processClientError(res, 403, errorMessage)
    }

    const whereParams = { id: req.account.id }
    const dataParams = { apartment_id: invitation.apartment.id }
    await accountModel.update(whereParams, dataParams)
    await invitationModel.deleteMany({ invitee_id: req.account.id })

    res.status(200).json({
      msg:
        `Accept invitation to ${invitation.apartment.name} ` +
        `from ${invitation.invitor.username}`,
    })
    await pusher.trigger(`notification-channel-${invitation.invitor.id}`, 'invitation', {
      state: 'ACCEPTED',
      invitor: invitation.invitor.username,
      invitee: req.account.username,
      apartment: invitation.apartment.name,
    })
  } catch (err) {
    next(err)
  }
}

async function deleteOne(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const invitationId = Number(req.params.id)

  try {
    const invitation = await invitationModel.find({
      id: invitationId,
    })
    if (invitation === null || invitation.invitor.username !== req.account.username) {
      const errorMessage = 'Forbidden error'
      return processClientError(res, 403, errorMessage)
    }

    await invitationModel.deleteMany({ id: invitationId })

    res.status(204).json()
    await pusher.trigger(`notification-channel-${invitation.invitee.id}`, 'invitation', {
      state: 'CANCELED',
      invitor: req.account.username,
      invitee: invitation.invitee.username,
      apartment: req.account.apartment.name,
    })
  } catch (err) {
    next(err)
  }
}

export default {
  findMany,
  create,
  reject,
  accept,
  deleteOne,
}

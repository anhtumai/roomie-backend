import { Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

import apartmentModel, { createApartmentAndDeletePendingInvitations } from '../models/apartment'
import accountModel from '../models/account'
import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import taskModel from '../models/task'

import apartmentPusher from '../pusher/apartment'

import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

import { apartmentHelper } from './helper/apartment'

function validateApartmentProperty(apartmentProperty: any): boolean {
  const { name } = apartmentProperty
  return typeof name === 'string'
}

// middleware for /api/apartments/:id endpoints
export async function adminPermissionValidatorForApartmentsId(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apartmentId = Number(req.params.id)

  const apartment = await apartmentModel.find({ id: apartmentId })

  if (!apartment || apartment.admin_id !== req.account.id) {
    const errorMessage = 'Forbidden error'
    return processClientError(res, 403, errorMessage)
  }
  next()
}

// middleware for /api/me/apartment/... endpoints
export async function adminPermissionValidatorForMeApartment(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.account.apartment) {
    const errorMessage = 'You don\'t have an apartment'
    return processClientError(res, 400, errorMessage)
  }

  try {
    const apartmentId = req.account.apartment.id

    const displayApartment = await apartmentModel.find({ id: apartmentId })

    if (displayApartment.admin_id !== req.account.id) {
      const errorMessage = 'Forbidden error'
      return processClientError(res, 403, errorMessage)
    }
    next()
  } catch (err) {
    next(err)
  }
}

async function findJoinTasksApartment(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apartment = req.account.apartment
  if (!apartment) {
    res.status(204).json()
    return
  }
  try {
    const apartmentId = apartment.id

    // query
    const displayApartment = await apartmentModel.findJoinAdminNMembersApartment({
      id: apartmentId,
    })
    const memberIds = displayApartment.members.map((member) => member.id)
    const responseTaskRequests = await taskRequestModel.findResponseTaskRequests(memberIds)

    const responseAssignments = await taskAssignmentModel.findResponseTaskAssignments(memberIds)

    res.status(200).json({
      ...displayApartment,
      task_requests: responseTaskRequests,
      task_assignments: responseAssignments,
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
  if (!req.body.name) {
    const errorMessage = 'Invalid body: apartment name is missing'
    return processClientError(res, 400, errorMessage)
  }
  try {
    // mutation
    const apartmentId = await createApartmentAndDeletePendingInvitations(
      req.body.name,
      req.account.id
    )

    const newApartment = {
      id: apartmentId,
      name: req.body.name,
      admin_id: req.account.id,
    }
    res.status(201).json(newApartment)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2014') {
        const errorMessage = 'User can only live in 1 apartment'
        return processClientError(res, 400, errorMessage)
      }
    }
    next(err)
  }
}

async function update(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apartmentId = Number(req.params.id)

  if (!validateApartmentProperty(req.body)) {
    const errorMessage = 'Invalid body: apartment name is missing'
    return processClientError(res, 400, errorMessage)
  }
  const { name } = req.body
  try {
    // mutation
    const updatedApartment = await apartmentModel.update({ id: apartmentId }, { name })

    // query after mutation
    const displayApartment = await apartmentModel.findJoinAdminNMembersApartment({
      id: apartmentId,
    })
    res.status(200).json(updatedApartment)

    // post response
    const memberIds = displayApartment.members.map((member) => member.id)
    await apartmentPusher.notifyAfterUpdating(
      memberIds.filter((memberId) => memberId !== req.account.id),
      updatedApartment.name,
      req.account
    )
  } catch (err) {
    next(err)
  }
}

async function deleteOne(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const id = Number(req.params.id)

  try {
    // query
    const toDeleteApartment = await apartmentModel.findJoinAdminNMembersApartment({ id })

    // mutation
    const taskWhereParams = {
      OR: toDeleteApartment.members.map((member) => ({
        creator_id: member.id,
      })),
    }
    await taskModel.deleteMany(taskWhereParams)

    await apartmentModel.deleteOne({ id })
    res.status(204).json()
  } catch (err) {
    next(err)
  }
}

async function leave(req: RequestAfterExtractor, res: Response, next: NextFunction): Promise<void> {
  const apartment = req.account.apartment
  if (!apartment) {
    res.status(204).json()
    return
  }

  let currentAdminUsername = ''
  try {
    const apartmentId = apartment.id

    const displayApartment = await apartmentModel.findJoinAdminNMembersApartment({
      id: apartmentId,
    })

    currentAdminUsername = displayApartment.admin.username
    const memberIds = displayApartment.members.map((member) => member.id)

    // mutation
    await apartmentHelper.cleanTaskRequests(memberIds, req.account.id)
    await apartmentHelper.cleanTaskAssignments(memberIds, req.account.id)

    await accountModel.deleteApartmentId({ id: req.account.id })

    if (displayApartment.members.length === 1) {
      await apartmentModel.deleteOne({ id: displayApartment.id })
    } else {
      if (displayApartment.admin.id === req.account.id) {
        const newAdmin = displayApartment.members.filter(
          (member) => member.id !== req.account.id
        )[0]
        await apartmentModel.update({ id: apartment.id }, { admin_id: newAdmin.id })
        currentAdminUsername = newAdmin.username
      }
    }

    res.status(200).json({
      msg: `Leave the aparment ${req.account.apartment.name}`,
    })

    await apartmentPusher.notifyAfterLeaving(memberIds, req.account, currentAdminUsername)
  } catch (err) {
    next(err)
  }
}

async function removeMember(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const removedMemberId = Number(req.params.id)
  const apartmentId = Number(req.account.apartment.id)

  if (removedMemberId === req.account.id) {
    const errorMessage = 'You cannot remove yourself. Please leave the apartment instead.'
    return processClientError(res, 400, errorMessage)
  }

  try {
    const displayApartment = await apartmentModel.findJoinAdminNMembersApartment({
      id: apartmentId,
    })
    const memberIds = displayApartment.members.map((member) => member.id)

    const removedMember = displayApartment.members.find((member) => member.id === removedMemberId)

    if (!memberIds.includes(removedMemberId)) {
      const errorMessage = `Apartment has no member with ID ${removedMemberId}`
      return processClientError(res, 400, errorMessage)
    }

    await apartmentHelper.cleanTaskRequests(memberIds, removedMemberId)
    await apartmentHelper.cleanTaskAssignments(memberIds, removedMemberId)

    await accountModel.deleteApartmentId({ id: removedMemberId })

    res.status(200).json({
      msg: `Remove member ${removedMember.username}`,
    })

    await apartmentPusher.notifyAfterRemovingMember(
      memberIds.filter((memberId) => memberId !== req.account.id),
      removedMember.username,
      req.account
    )
  } catch (err) {
    next(err)
  }
}

export default {
  findJoinTasksApartment,
  create,
  update,
  deleteOne,
  leave,
  removeMember,
}

import { Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

import apartmentModel from '../models/apartment'
import accountModel from '../models/account'
import invitationModel from '../models/invitation'
import taskRequestModel from '../models/taskRequest'
import taskAssignmentModel from '../models/taskAssignment'
import taskModel from '../models/task'

import { RequestAfterExtractor } from '../types/express-middleware'
import processClientError from '../util/error'

import { leaveApartmentHelper } from './helper/apartment'

function validateApartmentProperty(apartmentProperty: any): boolean {
  const { name } = apartmentProperty
  return typeof name === 'string'
}

export async function adminPermissionValidator(
  req: RequestAfterExtractor,
  res: Response,
  next: NextFunction
): Promise<void> {
  const id = Number(req.params.id)

  const apartment = await apartmentModel.find({ id })

  if (!apartment || apartment.admin_id !== req.account.id) {
    const errorMessage = 'Forbidden error'
    return processClientError(res, 403, errorMessage)
  }
  next()
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
    const newApartment = await apartmentModel.create(req.body.name, req.account.id)
    await accountModel.update({ id: req.account.id }, { apartment_id: newApartment.id })
    await invitationModel.deleteMany({ invitee_id: req.account.id })
    res.status(201).json(newApartment)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2014') {
        const errorMessage = 'ConditionNotMeet error: User can only live in 1 apartment'
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
    const errorMessage = 'Invalid body'
    return processClientError(res, 400, errorMessage)
  }
  const { name } = req.body
  try {
    const updatedApartment = await apartmentModel.update({ id: apartmentId }, { name })
    res.status(200).json(updatedApartment)
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
    const toDeleteApartment = await apartmentModel.findJoinAdminNMembersApartment({ id })

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

    await leaveApartmentHelper.cleanTaskRequests(memberIds, req.account.id)
    await leaveApartmentHelper.cleanTaskAssignments(memberIds, req.account.id)

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

    await leaveApartmentHelper.notifyAfterLeaving(
      memberIds.filter((memberId) => memberId !== req.account.id),
      req.account.username,
      currentAdminUsername
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
}

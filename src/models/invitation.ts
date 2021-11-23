import { Prisma } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

export type PendingInvitation = {
  id: number
  invitor: Profile
  invitee: Profile
  apartment: {
    id: number
    name: string
  }
}

async function create(
  invitorId: number,
  inviteeId: number,
  apartmentId: number
): Promise<PendingInvitation | null> {
  const newInvitation = await prisma.invitation.create({
    data: {
      invitor_id: invitorId,
      invitee_id: inviteeId,
      apartment_id: apartmentId,
    },
    select: {
      id: true,
      invitor: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      invitee: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      apartment: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  return newInvitation
}

async function find(whereParams: Prisma.InvitationWhereUniqueInput): Promise<PendingInvitation> {
  const invitation = await prisma.invitation.findFirst({
    where: whereParams,
    select: {
      id: true,
      invitor: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      invitee: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      apartment: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  return invitation
}

async function findMany(whereParams: Prisma.InvitationWhereInput): Promise<PendingInvitation[]> {
  const invitations = await prisma.invitation.findMany({
    where: whereParams,
    orderBy: {
      id: 'asc',
    },
    select: {
      id: true,
      invitor: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      invitee: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      apartment: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  return invitations
}

async function deleteOne(whereParams: Prisma.InvitationWhereUniqueInput): Promise<void> {
  await prisma.invitation.delete({
    where: whereParams,
  })
}

async function deleteMany(deleteParams: Prisma.InvitationWhereInput): Promise<number> {
  const deletedInvitations = await prisma.invitation.deleteMany({
    where: deleteParams,
  })

  return deletedInvitations.count
}

async function deleteAll(): Promise<void> {
  await prisma.invitation.deleteMany({})
}

export default {
  create,
  find,
  findMany,
  deleteOne,
  deleteMany,
  deleteAll,
}

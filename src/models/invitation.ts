import { PrismaClient, Invitation } from '@prisma/client'

import { DisplayAccount } from './account'

const prisma = new PrismaClient()

type PendingInvitation = {
    id: number
    invitor: DisplayAccount
    invitee: DisplayAccount
    apartment: {
        id: number
        name: string
    }
}

async function createNewInvitation(
    invitorId: number,
    inviteeId: number,
    apartmentId: number,
): Promise<Invitation | null> {
    const newInvitation = await prisma.invitation.create({
        data: {
            invitorId,
            inviteeId,
            apartmentId,
        },
    })
    return newInvitation
}

async function findInvitation(
    findParams: Record<any, any>,
): Promise<PendingInvitation> {
    const invitation = await prisma.invitation.findFirst({
        where: findParams,
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

async function findInvitations(
    findParams: Record<any, any>,
): Promise<PendingInvitation[]> {
    const invitations = await prisma.invitation.findMany({
        where: findParams,
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

async function deleteInvitations(
    deleteParams: Record<string, string | number>,
): Promise<number> {
    const deletedInvitations = await prisma.invitation.deleteMany({
        where: deleteParams,
    })

    return deletedInvitations.count
}

export default {
    createNewInvitation,
    findInvitation,
    findInvitations,
    deleteInvitations,
}

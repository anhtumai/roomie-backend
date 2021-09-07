import { PrismaClient, Invitation } from '.prisma/client'

const prisma = new PrismaClient()

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

async function findInvitations(
    findParams: Record<string, string | number>,
): Promise<Invitation[]> {
    const invitations = await prisma.invitation.findMany({
        where: findParams,
        orderBy: {
            id: 'asc',
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
    findInvitations,
    deleteInvitations,
}

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

async function findInvitationsByInviteeId(inviteeId) {}

export default {
    createNewInvitation,
}

import { Account, Apartment, Membership } from '@prisma/client'

import { prisma } from './client'

async function create(
    memberId: number,
    apartmentId: number,
): Promise<Membership> {
    const newMembership = await prisma.membership.create({
        data: {
            member: {
                connect: {
                    id: memberId,
                },
            },
            apartment: {
                connect: {
                    id: apartmentId,
                },
            },
        },
    })

    return newMembership
}

async function isMemberOfApartment(
    memberId: number,
    apartmentId: number,
): Promise<boolean> {
    const membership = await find({ memberId })
    if (membership === null) return false
    return membership.apartmentId === apartmentId
}
async function find(
    findParams: Record<string, string | number>,
): Promise<Membership | null> {
    const membership = await prisma.membership.findFirst({
        where: findParams,
    })
    return membership
}

async function findApartment(memberId: number): Promise<Apartment | null> {
    const membership = await prisma.membership.findFirst({
        where: {
            memberId,
        },
        include: {
            apartment: true,
        },
    })
    if (membership === null) return null
    return membership.apartment
}

async function findAllMembers(apartmentId: number): Promise<Account[]> {
    const memberships = await prisma.membership.findMany({
        where: {
            apartmentId,
        },
        include: {
            member: true,
        },
    })
    return memberships.map((membership) => membership.member)
}

async function deleteOne(deleteParams: Record<any, any>): Promise<void> {
    await prisma.membership.delete({
        where: deleteParams,
    })
}

async function deleteMany(deleteParams: Record<any, any>): Promise<void> {
    await prisma.membership.deleteMany({
        where: deleteParams,
    })
}

async function deleteAll(): Promise<void> {
    await prisma.membership.deleteMany({})
}

export default {
    create,
    isMemberOfApartment,
    find,
    findApartment,
    findAllMembers,
    deleteOne,
    deleteMany,
    deleteAll,
}

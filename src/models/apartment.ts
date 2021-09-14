import { Apartment } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

type DisplayApartment = {
    id: number
    name: string
    admin: Profile
    members: Profile[]
}

async function findDisplayApartment(
    findParams: Record<any, any>,
): Promise<DisplayApartment | null> {
    const displayApartment = await prisma.apartment.findFirst({
        where: findParams,
        select: {
            id: true,
            name: true,
            admin: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
            members: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
        },
    })
    return displayApartment
}

async function find(
    findParams: Record<string, string | number>,
): Promise<Apartment | null> {
    const apartment = await prisma.apartment.findFirst({
        where: findParams,
    })
    return apartment
}

async function create(name: string, adminId: number): Promise<Apartment> {
    const newApartment = await prisma.apartment.create({
        data: {
            name,
            admin: {
                connect: {
                    id: adminId,
                },
            },
        },
    })
    return newApartment
}

async function deleteOne(deleteParams: Record<any, any>): Promise<void> {
    await prisma.apartment.delete({
        where: deleteParams,
    })
}

async function deleteMany(deleteParams: Record<any, any>): Promise<void> {
    await prisma.apartment.deleteMany({
        where: deleteParams,
    })
}

async function deleteAll(): Promise<void> {
    await prisma.apartment.deleteMany({})
}

export default {
    find,
    findDisplayApartment,
    create,
    deleteOne,
    deleteMany,
    deleteAll,
}

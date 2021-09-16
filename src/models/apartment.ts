import { Apartment, Prisma } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

type DisplayApartment = {
    id: number
    name: string
    admin: Profile
    members: Profile[]
}

async function findDisplayApartment(
    whereParams: Prisma.ApartmentWhereInput,
): Promise<DisplayApartment | null> {
    const displayApartment = await prisma.apartment.findFirst({
        where: whereParams,
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
    whereParams: Prisma.ApartmentWhereInput,
): Promise<Apartment | null> {
    const apartment = await prisma.apartment.findFirst({
        where: whereParams,
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

async function deleteOne(
    whereParams: Prisma.ApartmentWhereUniqueInput,
): Promise<void> {
    await prisma.apartment.delete({
        where: whereParams,
    })
}

async function deleteMany(
    whereParams: Prisma.ApartmentWhereInput,
): Promise<void> {
    await prisma.apartment.deleteMany({
        where: whereParams,
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

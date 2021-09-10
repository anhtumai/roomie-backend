import { Apartment, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    create,
    deleteOne,
    deleteMany,
    deleteAll,
}

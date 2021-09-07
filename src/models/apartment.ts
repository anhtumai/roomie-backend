import { Apartment, Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findApartment(adminId: number): Promise<Apartment | null> {
    const apartment = await prisma.apartment.findFirst({
        where: {
            adminId: adminId,
        },
    })
    return apartment
}

async function createApartment(
    name: string,
    adminId: number,
): Promise<Apartment> {
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

async function deleteApartment(adminId: number): Promise<Apartment | null> {
    const deletedApartment = await prisma.apartment.findFirst({
        where: {
            adminId: adminId,
        },
    })

    if (deletedApartment === null) return null

    await prisma.apartment.delete({
        where: {
            id: deletedApartment.id,
        },
    })
    return deletedApartment
}

export default {
    findApartment,
    createApartment,
    deleteApartment,
}

import { Apartment, PrismaClient } from '@prisma/client'

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
            Admin: {
                connect: {
                    id: adminId,
                },
            },
        },
    })
    return newApartment
}

export default {
    findApartment,
    createApartment,
}

import { Apartment, Prisma } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

type JoinAdminNMembersApartment = {
  id: number
  name: string
  admin: Profile
  members: Profile[]
}

async function findJoinAdminNMembersApartment(
  whereParams: Prisma.ApartmentWhereInput
): Promise<JoinAdminNMembersApartment | null> {
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

async function find(whereParams: Prisma.ApartmentWhereInput): Promise<Apartment | null> {
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

async function update(apartmentId: number, name: string): Promise<Apartment> {
  const updatedApartment = await prisma.apartment.update({
    where: {
      id: apartmentId,
    },
    data: {
      name,
    },
  })
  return updatedApartment
}

async function deleteOne(whereParams: Prisma.ApartmentWhereUniqueInput): Promise<void> {
  await prisma.apartment.delete({
    where: whereParams,
  })
}

async function deleteMany(whereParams: Prisma.ApartmentWhereInput): Promise<void> {
  await prisma.apartment.deleteMany({
    where: whereParams,
  })
}

async function deleteAll(): Promise<void> {
  await prisma.apartment.deleteMany({})
}

export default {
  find,
  findJoinAdminNMembersApartment,
  create,
  update,
  deleteOne,
  deleteMany,
  deleteAll,
}

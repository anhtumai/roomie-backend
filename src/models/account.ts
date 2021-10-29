import { Account, Prisma } from '@prisma/client'

import { prisma } from './client'

export type Profile = {
  id: number
  username: string
  name: string
}

export type JoinApartmentAccount = Profile & {
  apartment?: {
    id: number
    name: string
  }
}

async function findJoinApartmentAccount(
  whereParams: Prisma.AccountWhereInput
): Promise<JoinApartmentAccount | null> {
  const account = await prisma.account.findFirst({
    where: whereParams,
    select: {
      id: true,
      username: true,
      name: true,
      apartment: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  return account
}

async function findProfile(whereParams: Prisma.AccountWhereInput): Promise<Profile | null> {
  const account = await prisma.account.findFirst({
    where: whereParams,
    select: {
      id: true,
      username: true,
      name: true,
    },
  })
  return account
}

async function find(whereParams: Prisma.AccountWhereInput): Promise<Account | null> {
  const account = await prisma.account.findFirst({
    where: whereParams,
  })
  return account
}

async function findMany(whereParams: Prisma.AccountWhereInput): Promise<Account[]> {
  const account = await prisma.account.findMany({
    where: whereParams,
  })
  return account
}

async function create(username: string, name: string, passwordHash: string): Promise<Profile> {
  const newAccount = await prisma.account.create({
    data: {
      username,
      name,
      password: passwordHash,
    },
  })

  return {
    id: newAccount.id,
    username: newAccount.username,
    name: newAccount.name,
  }
}

async function update(
  whereParams: Prisma.AccountWhereUniqueInput,
  dataParams: Prisma.AccountUncheckedUpdateInput
): Promise<void> {
  await prisma.account.update({
    where: whereParams,
    data: dataParams,
  })
}

async function updateMany(
  whereParams: Prisma.AccountWhereInput,
  dataParams: Prisma.AccountUncheckedUpdateInput
): Promise<void> {
  await prisma.account.updateMany({
    where: whereParams,
    data: dataParams,
  })
}

async function deleteOne(whereParams: Prisma.AccountWhereUniqueInput): Promise<void> {
  await prisma.account.delete({
    where: whereParams,
  })
}

async function deleteMany(whereParams: Prisma.AccountWhereInput): Promise<void> {
  await prisma.account.deleteMany({
    where: whereParams,
  })
}

async function deleteAll(): Promise<void> {
  await prisma.account.deleteMany({})
}

async function deleteApartmentId(whereParams: Prisma.AccountWhereUniqueInput): Promise<void> {
  await update(whereParams, { apartment_id: null })
}

export default {
  find,
  findMany,
  findJoinApartmentAccount,
  findProfile,
  create,
  update,
  updateMany,
  deleteOne,
  deleteMany,
  deleteAll,
  deleteApartmentId,
}

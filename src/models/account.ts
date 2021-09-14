import { Account } from '@prisma/client'

import { prisma } from './client'

export type Profile = {
    id: number
    username: string
    name: string
}

export type DisplayAccount = Profile & {
    apartment?: {
        id: number
        name: string
    }
}

async function findDisplayAccount(
    findParams: Record<any, any>,
): Promise<DisplayAccount | null> {
    const account = await prisma.account.findFirst({
        where: findParams,
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

async function findProfile(
    findParams: Record<string, string | number>,
): Promise<Profile | null> {
    const account = await prisma.account.findFirst({
        where: findParams,
        select: {
            id: true,
            username: true,
            name: true,
        },
    })
    return account
}

async function findAccount(
    findParams: Record<string, string | number>,
): Promise<Account | null> {
    const account = await prisma.account.findFirst({
        where: findParams,
    })
    return account
}

async function create(
    username: string,
    name: string,
    passwordHash: string,
): Promise<Profile> {
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
    findParams: Record<any, any>,
    updateParams: Record<any, any>,
): Promise<void> {
    await prisma.account.update({
        where: findParams,
        data: updateParams,
    })
}

async function updateMany(
    findParams: Record<any, any>,
    updateParams: Record<any, any>,
): Promise<void> {
    await prisma.account.updateMany({
        where: findParams,
        data: updateParams,
    })
}

async function deleteOne(deleteParams: Record<any, any>): Promise<void> {
    await prisma.account.delete({
        where: deleteParams,
    })
}

async function deleteMany(deleteParams: Record<any, any>): Promise<void> {
    await prisma.account.deleteMany({
        where: deleteParams,
    })
}

async function deleteAll(): Promise<void> {
    await prisma.account.deleteMany({})
}

export default {
    findAccount,
    findDisplayAccount,
    findProfile,
    create,
    update,
    updateMany,
    deleteOne,
    deleteMany,
    deleteAll,
}

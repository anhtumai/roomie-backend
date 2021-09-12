import { Account } from '@prisma/client'

import { prisma } from './client'

export type DisplayAccount = {
    id?: number
    username: string
    name: string
}

async function findDisplayAccount(
    findParams: Record<string, string | number>,
): Promise<DisplayAccount | null> {
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
): Promise<DisplayAccount> {
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
    create,
    deleteOne,
    deleteMany,
    deleteAll,
}

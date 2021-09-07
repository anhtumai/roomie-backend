import { PrismaClient, Account } from '@prisma/client'

import { AccountWithoutPassword } from '../types/express-middleware'

const prisma = new PrismaClient()

async function findAccountWithoutPassword(
    findParams: Record<string, string | number>,
): Promise<AccountWithoutPassword | null> {
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

async function createAccount(
    username: string,
    name: string,
    passwordHash: string,
): Promise<AccountWithoutPassword> {
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

export default {
    findAccount,
    findAccountWithoutPassword,
    createAccount,
}

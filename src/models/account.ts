import { PrismaClient, Account } from '@prisma/client'

import { AccountWithoutPassword } from '../types/express-middleware'

const prisma = new PrismaClient()

async function findAccountById(id: number): Promise<AccountWithoutPassword> {
    const account = await prisma.account.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            username: true,
            name: true,
        },
    })
    return account
}

async function findAccountByUsername(
    username: string,
): Promise<Account | null> {
    const account = await prisma.account.findFirst({
        where: { username },
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
    findAccountById,
    findAccountByUsername,
    createAccount,
}

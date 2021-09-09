import { PrismaClient, Account } from '@prisma/client'

const prisma = new PrismaClient()

export type DisplayAccount = {
    id: number
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

async function createAccount(
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

export default {
    findAccount,
    findDisplayAccount,
    createAccount,
}

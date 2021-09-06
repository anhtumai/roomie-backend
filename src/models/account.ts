import { PrismaClient, Account } from '@prisma/client'

const prisma = new PrismaClient()

async function findAccountById(id: number): Promise<{
    id: number
    username: string
    name: string
}> {
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
): Promise<Account> {
    const newAccount = await prisma.account.create({
        data: {
            username,
            name,
            password: passwordHash,
        },
    })

    return newAccount
}

export default {
    findAccountById,
    findAccountByUsername,
    createAccount,
}

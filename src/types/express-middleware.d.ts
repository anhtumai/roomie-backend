import { Request } from 'express'

export interface AccountWithoutPassword {
    id: number
    username: string
    name: string
}

export interface RequestAfterExtractor extends Request {
    token: string
    account: AccountWithoutPassword
}

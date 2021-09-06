import { Request } from 'express'

export interface RequestAfterExtractor extends Request {
    token: string
    account: any
}

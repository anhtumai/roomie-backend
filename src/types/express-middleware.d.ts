import { Request } from 'express'
import { DisplayAccount } from '../models/account'

export interface RequestAfterExtractor extends Request {
    token: string
    account: DisplayAccount
}

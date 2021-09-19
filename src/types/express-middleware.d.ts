import { Request } from 'express'
import { JoinApartmentAccount } from '../models/account'

export interface RequestAfterExtractor extends Request {
    token: string
    account: JoinApartmentAccount
}

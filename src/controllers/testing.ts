import { Router } from 'express'

import accountModel from '../models/account'
import apartmentModel from '../models/apartment'
import membershipModel from '../models/membership'
import invitationModel from '../models/invitation'

const testingRouter = Router()

testingRouter.post('/deleteAll', async (req, res, next) => {
    await invitationModel.deleteAll()
    await membershipModel.deleteAll()
    await apartmentModel.deleteAll()
    await accountModel.deleteAll()

    return res.status(200).json({ msg: 'Delete everything' })
})

export default testingRouter

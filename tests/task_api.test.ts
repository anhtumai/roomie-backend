import supertest from 'supertest'

import app from '../src/app'
import { prisma } from '../src/models/client'

import accountModel from '../src/models/account'

import utils from './utils'
import users from './users'

const api = supertest(app)

const user1 = users.find((user) => user.username === 'anhtumai')
const testuser1 = users.find((user) => user.username === 'firsttestuser')
const testuser2 = users.find((user) => user.username === 'secondtestuser')
const testuser3 = users.find((user) => user.username === 'thirdtestuser')

const apartmentName = 'Hoas Family Apartment'

let user1Token = ''
let testuser1Token = ''
let testuser2Token = ''
let testuser3Token = ''

beforeAll(async () => {
    await utils.deleteAll()

    await utils.registerUsers(api, [user1, testuser1, testuser2, testuser3])

    user1Token = await utils.login(api, user1)
    testuser1Token = await utils.login(api, testuser1)
    testuser2Token = await utils.login(api, testuser2)
    testuser3Token = await utils.login(api, testuser3)

    await utils.createNewApartment(api, user1Token, apartmentName)

    const invitationIds = await utils.sendInvitations(api, user1Token, [
        testuser1.username,
        testuser2.username,
    ])

    await utils.acceptInvitation(api, testuser1Token, invitationIds[0])
    await utils.acceptInvitation(api, testuser2Token, invitationIds[1])
})

describe('dummy test', () => {
    test('1', async () => {
        const x = 1
        expect(x).toEqual(1)
    })
})

afterAll(async () => {
    await prisma.$disconnect()
})

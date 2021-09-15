import supertest from 'supertest'

import app from '../src/app'
import { prisma } from '../src/models/client'

import accountModel from '../src/models/account'
import apartmentModel from '../src/models/apartment'
import invitationModel from '../src/models/invitation'

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

    await utils.registerUser(api, user1)
    await utils.registerUser(api, testuser1)
    await utils.registerUser(api, testuser2)
    await utils.registerUser(api, testuser3)

    user1Token = await utils.login(api, user1)
    testuser1Token = await utils.login(api, testuser1)
    testuser2Token = await utils.login(api, testuser2)
    testuser3Token = await utils.login(api, testuser3)
})

describe('GET /api/me', () => {
    test('get current apartment should return null', async () => {
        const response = await api
            .get('/api/me')
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(200)
        expect(response.body.name).toEqual(user1.name)
        expect(response.body.apartment).toBeNull()
    })
    test('get /apartment should return 204', async () => {
        await api
            .get('/api/me/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(204)
    })
})

describe('POST /api/apartments', () => {
    test('create new apartment with missing information should return 400', async () => {
        await api
            .post('/api/apartments')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({})
            .expect(400)
    })

    test('create new apartment', async () => {
        const response = await api
            .post('/api/apartments')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ name: apartmentName })
            .expect(201)
        expect(response.body.name).toEqual(apartmentName)
        expect(typeof response.body.id).toBe('number')

        const savedApartment = await apartmentModel.find({
            id: response.body.id,
        })
        const savedAccount = await accountModel.findDisplayAccount({
            id: savedApartment.adminId,
        })

        expect(savedAccount.name).toBe(user1.name)
        expect(savedApartment.name).toBe(apartmentName)
    })
})

describe('GET /api/me after apartment creation', () => {
    test('Get apartment should not be empty', async () => {
        const response = await api
            .get('/api/me')
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(200)
        expect(response.body.apartment.name).toEqual(apartmentName)
    })
})

describe('POST /api/invitations', () => {
    test('Create invitation with missing information', async () => {
        await api
            .post('/api/invitations')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({})
            .expect(400)
    })
    test('Create invitation with none existing username', async () => {
        await api
            .post('/api/invitations')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ username: 'nonexistingusername' })
            .expect(404)
    })
    test('Create invitation when you dont belong to any apartments', async () => {
        await api
            .post('/api/invitations')
            .set('Authorization', 'Bearer ' + testuser1Token)
            .send({ username: 'testuser2' })
            .expect(404)
    })

    test('Create valid invitation for testuser1', async () => {
        const response = await api
            .post('/api/invitations')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ username: testuser1.username })
            .expect(201)
        expect(response.body.invitor.username).toBe(user1.username)

        const invitationId = response.body.id
        const invitation = await invitationModel.find({ id: invitationId })
        expect(invitation.invitee.username).toEqual(testuser1.username)
    })
})

describe('GET /api/me/invitations', () => {
    test('get your own invitations should return sent and received list', async () => {
        const invitorResponse = await api
            .get('/api/me/invitations')
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(200)
        expect(invitorResponse.body.sent).toHaveLength(1)

        const inviteeResponse = await api
            .get('/api/me/invitations')
            .set('Authorization', 'Bearer ' + testuser1Token)
            .expect(200)
        expect(inviteeResponse.body.received).toHaveLength(1)
    })
})

afterAll(async () => {
    await prisma.$disconnect()
})

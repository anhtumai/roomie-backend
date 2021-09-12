import supertest from 'supertest'

import app from '../src/app'
import { prisma } from '../src/models/client'
import aprtmentModel from '../src/models/apartment'
import invitationModel from '../src/models/invitation'

import users from './users'
import accountModel from '../src/models/account'

const api = supertest(app)

async function registerUser(user: any): Promise<void> {
    await api
        .post('/api/register')
        .send(user)
        .expect(201)
        .expect('Content-Type', /application\/json/)
}

async function login(username: string, password: string): Promise<string> {
    const response = await api
        .post('/api/login')
        .send({ username, password })
        .expect(200)
    return response.body.token
}

const user1 = users.find((user) => user.username === 'anhtumai')
const testuser1 = users.find((user) => user.username === 'firsttestuser')
const testuser2 = users.find((user) => user.username === 'secondtestuser')
const testuser3 = users.find((user) => user.username === 'thirdtestuser')

const apartmentName = 'Hoas Family Apartment'

let user1Token = ''
let testuser1Token = ''
let testuser2Token = ''

beforeAll(async () => {
    await api.post('/api/testing/deleteAll')
    await registerUser(user1)
    await registerUser(testuser1)
    await registerUser(testuser2)
    await registerUser(testuser3)

    user1Token = await login(user1.username, user1.password)
    testuser1Token = await login(testuser1.username, testuser1.password)
    testuser2Token = await login(testuser2.username, testuser2.password)
})

describe('Test create apartment', () => {
    test('Get current apartment should return null', async () => {
        const response = await api
            .get('/api/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(200)
        expect(response.body.data).toBeNull()
    })

    test('Create new apartment', async () => {
        await api
            .post('/api/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({})
            .expect(400)

        const response = await api
            .post('/api/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ name: apartmentName })
            .expect(201)
        expect(response.body.data.name).toEqual(apartmentName)
        expect(typeof response.body.data.id).toBe('number')

        const savedApartment = await aprtmentModel.find({
            id: response.body.data.id,
        })
        const savedAccount = await accountModel.findDisplayAccount({
            id: savedApartment.adminId,
        })

        expect(savedAccount.name).toBe(user1.name)
        expect(savedApartment.name).toBe(apartmentName)
    })
})

describe('Test send invitation', () => {
    let apartmentId = 0
    test('Get current apartment', async () => {
        const response = await api
            .get('/api/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(200)
        expect(response.body.data.name).toBe(apartmentName)
        apartmentId = response.body.data.id
    })
    test('Create invitation with missing information', async () => {
        await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({})
            .expect(400)
    })
    test('Create invitation with none existing username', async () => {
        await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ username: 'nonexistingusername', apartmentId })
            .expect(404)
    })
    test('Create invitation with apartment you dont belong to', async () => {
        await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + testuser1Token)
            .send({ username: 'anhtumai', apartmentId })
            .expect(404)
    })
    test('Create valid invitation', async () => {
        const response = await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ username: testuser1.username, apartmentId })
            .expect(201)
        expect(response.body.invitor.username).toBe(user1.username)

        const invitationId = response.body.id
        const invitation = await invitationModel.find({ id: invitationId })
        expect(invitation.invitee.username).toEqual(testuser1.username)
    })
})

afterAll(async () => {
    await prisma.$disconnect()
})

import supertest from 'supertest'

import app from '../src/app'
import { prisma } from '../src/models/client'
import accountModel from '../src/models/account'

import users from './users'

const api = supertest(app)

beforeAll(async () => {
    console.log('Reset all everything')
    await api.post('/api/testing/deleteAll')
})

describe('Test Authentication', () => {
    const user1 = users.find((user) => user.username === 'anhtumai')
    const testuser1 = users.find((user) => user.username === 'firsttestuser')
    test('test register new user', async () => {
        const response = await api
            .post('/api/register')
            .send(user1)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const createdUser = response.body
        expect(createdUser.name).toEqual(user1.name)
        expect(createdUser.username).toEqual(user1.username)
        expect(createdUser.password).toBeUndefined()

        const savedUser = await accountModel.findAccount({
            username: user1.username,
        })
        expect(savedUser.username).toEqual(user1.username)
        expect(savedUser.name).toEqual(user1.name)
    })
    test('test login', async () => {
        await api
            .post('/api/login')
            .send({ username: testuser1.username, password: testuser1.password })
            .expect(401)

        await api.post('/api/login').send({}).expect(400)
        await api
            .post('/api/login')
            .send({ password: 'anhtumaipassword' })
            .expect(400)

        const validLoginResponse = await api
            .post('/api/login')
            .send({ username: user1.username, password: user1.password })
            .expect(200)
        expect(typeof validLoginResponse.body.token).toEqual('string')
    })
    test('invalid register', async () => {
    // register dupplicate username
        await api.post('/api/register').send(user1).expect(400)

        // register missing information
        await api.post('/api/register').send({}).expect(400)
    })
})

afterAll(async () => {
    await prisma.$disconnect()
})

import supertest from 'supertest'

import app from '../src/app'

import { prisma } from '../src/models/client'
import accountModel from '../src/models/account'

import utils from './utils'
import users from './users'

const api = supertest(app)

const user1 = users.find((user) => user.username === 'anhtumai')
const testuser1 = users.find((user) => user.username === 'firsttestuser')

beforeAll(async () => {
  await utils.deleteAll()
})

describe('POST /api/accounts', () => {
  test('register new user', async () => {
    const response = await api
      .post('/api/accounts')
      .send(user1)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const createdUser = response.body
    expect(createdUser.name).toEqual(user1.name)
    expect(createdUser.username).toEqual(user1.username)
    expect(createdUser.password).toBeUndefined()

    const savedUser = await accountModel.find({
      username: user1.username,
    })
    expect(savedUser.username).toEqual(user1.username)
    expect(savedUser.name).toEqual(user1.name)
  })

  test('register with dupplicated username', async () => {
    await api.post('/api/accounts').send(user1).expect(400)
  })
  test('register with missing information', async () => {
    await api.post('/api/accounts').send({}).expect(400)
  })
})

describe('POST /api/auth/login', () => {
  test('login with invalid credentials', async () => {
    await api
      .post('/api/auth/login')
      .send({ username: testuser1.username, password: testuser1.password })
      .expect(401)
  })

  test('login with missing info', async () => {
    await api.post('/api/auth/login').send({}).expect(400)
    await api.post('/api/auth/login').send({ password: 'anhtumaipassword' }).expect(400)
  })

  test('login with valid credentials', async () => {
    const validLoginResponse = await api
      .post('/api/auth/login')
      .send({ username: user1.username, password: user1.password })
      .expect(200)
    expect(typeof validLoginResponse.body.token).toEqual('string')
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})

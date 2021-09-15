import supertest, { SuperTest } from 'supertest'

import accountModel from '../src/models/account'
import apartmentModel from '../src/models/apartment'
import invitationModel from '../src/models/invitation'

async function deleteAll(): Promise<void> {
    await invitationModel.deleteAll()
    await apartmentModel.deleteAll()
    await accountModel.deleteAll()
}

async function registerUser(
    api: SuperTest<supertest.Test>,
    user: any,
): Promise<void> {
    await api
        .post('/api/register')
        .send(user)
        .expect(201)
        .expect('Content-Type', /application\/json/)
}

async function login(
    api: SuperTest<supertest.Test>,
    user: { username: string; password: string },
): Promise<string> {
    const { username, password } = user
    const response = await api
        .post('/api/login')
        .send({ username, password })
        .expect(200)
    return response.body.token
}

export default {
    deleteAll,
    registerUser,
    login,
}

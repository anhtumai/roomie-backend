import supertest, { SuperTest } from 'supertest'

import accountModel from '../src/models/account'
import apartmentModel from '../src/models/apartment'
import invitationModel, { PendingInvitation } from '../src/models/invitation'

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

async function sendInvitation(
    api: SuperTest<supertest.Test>,
    invitorToken: string,
    inviteeUsername: string,
): Promise<PendingInvitation> {
    const response = await api
        .post('/api/invitations')
        .set('Authorization', 'Bearer ' + invitorToken)
        .send({ username: inviteeUsername })
        .expect(201)
    return response.body
}

export default {
    deleteAll,
    registerUser,
    login,
    sendInvitation,
}
